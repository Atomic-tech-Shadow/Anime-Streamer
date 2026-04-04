import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();
const ANIME_API = "https://anime-sama-scraper.vercel.app";

const LANG_TO_SLUG: Record<string, string> = {
  VOSTFR: "vostfr", VO: "vostfr", VF: "vf", VF1: "vf1", VF2: "vf2",
  VA: "va", VAR: "var", VKR: "vkr", VCN: "vcn", VQC: "vqc",
};

function langToSlug(lang: string): string {
  return LANG_TO_SLUG[lang.toUpperCase()] ?? lang.toLowerCase();
}

async function fetchEmbed(url: string): Promise<any> {
  const r = await fetch(`${ANIME_API}/api/embed?url=${encodeURIComponent(url)}`);
  return r.json();
}

router.get("/anime-proxy/embed-episodes/:animeId", async (req, res) => {
  const { animeId } = req.params;
  const season = (req.query.season as string) ?? "saison1";
  const language = (req.query.language as string) ?? "VOSTFR";
  const langSlug = langToSlug(language);
  const baseUrl = `https://anime-sama.to/catalogue/${animeId}/${season}/${langSlug}/episode-`;

  const BATCH = 20;
  const MAX = 300;
  const episodes: any[] = [];

  for (let start = 1; start <= MAX; start += BATCH) {
    const nums = Array.from({ length: BATCH }, (_, i) => start + i);
    const results = await Promise.all(
      nums.map(async (num) => {
        try {
          const d = await fetchEmbed(baseUrl + num);
          if (d.error || !d.sources?.length) return null;
          const sources = [...d.sources].sort(
            (a: any, b: any) => (a.serverNumber ?? 99) - (b.serverNumber ?? 99)
          );
          return { number: num, title: `Épisode ${num}`, streamingSources: sources, available: true };
        } catch {
          return null;
        }
      })
    );
    const found = results.filter(Boolean);
    episodes.push(...found);
    if (found.length < nums.length) break;
  }

  if (!episodes.length) {
    res.status(404).json({ error: "No episodes found" });
    return;
  }

  res.json({ success: true, animeId, season, language, count: episodes.length, episodes });
});

router.use("/anime-proxy", async (req, res) => {
  const subPath = req.path;
  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  const url = `${ANIME_API}/api${subPath}${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    logger.error({ err, subPath }, "anime-proxy error");
    res.status(502).json({ error: "Proxy error" });
  }
});

export default router;
