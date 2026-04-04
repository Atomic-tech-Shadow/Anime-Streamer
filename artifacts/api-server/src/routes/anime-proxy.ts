import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();
const ANIME_API = "https://anime-sama-scraper.vercel.app";

const LANG_TO_URL: Record<string, string> = {
  VOSTFR: "vostfr", VO: "vostfr", VF: "vf", VF1: "vf1", VF2: "vf2",
  VA: "va", VAR: "var", VKR: "vkr", VCN: "vcn", VQC: "vqc",
};

function langToSlug(lang: string): string {
  return LANG_TO_URL[lang.toUpperCase()] ?? lang.toLowerCase();
}

async function probeEpisodesViaEmbed(
  animeId: string,
  seasonValue: string,
  language: string
): Promise<any[] | null> {
  const langSlug = langToSlug(language);
  const baseEpUrl = `https://anime-sama.to/catalogue/${animeId}/${seasonValue}/${langSlug}/episode-`;
  const MAX_EPISODES = 300;
  const BATCH = 20;

  async function probeOne(num: number): Promise<any | null> {
    try {
      const url = `${ANIME_API}/api/embed?url=${encodeURIComponent(baseEpUrl + num)}`;
      const d = await fetch(url).then((r) => r.json());
      if (d.error || !d.sources?.length) return null;
      const sorted = [...d.sources].sort(
        (a: any, b: any) => (a.serverNumber ?? 99) - (b.serverNumber ?? 99)
      );
      return { number: num, title: `Épisode ${num}`, streamingSources: sorted, available: true, url: baseEpUrl + num };
    } catch {
      return null;
    }
  }

  const episodes: any[] = [];

  for (let start = 1; start <= MAX_EPISODES; start += BATCH) {
    const nums = Array.from({ length: BATCH }, (_, i) => start + i);
    const results = await Promise.all(nums.map(probeOne));
    const found = results.filter(Boolean);
    episodes.push(...found);
    if (found.length < nums.length) break;
  }

  return episodes.length > 0
    ? episodes.sort((a, b) => a.number - b.number)
    : null;
}

router.use("/anime-proxy", async (req, res) => {
  const subPath = req.path;
  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  const upstreamUrl = `${ANIME_API}/api${subPath}${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(upstreamUrl);
    const data = await response.json();

    if (!data.error) {
      res.json(data);
      return;
    }

    const isEpisodesPath = /^\/episodes\/(.+)$/.exec(subPath);
    if (isEpisodesPath && data.error) {
      const animeId = decodeURIComponent(isEpisodesPath[1]);
      const season = (req.query.season as string) ?? "saison1";
      const language = (req.query.language as string) ?? "VOSTFR";

      logger.info({ animeId, season, language }, "Standard episodes failed — trying embed fallback");

      const episodes = await probeEpisodesViaEmbed(animeId, season, language);

      if (episodes) {
        res.json({
          success: true,
          animeId,
          season,
          language,
          count: episodes.length,
          episodes,
          source: "embed-fallback",
        });
        return;
      }

      logger.warn({ animeId, season }, "Embed fallback also failed");
    }

    res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    logger.error({ err, subPath }, "anime-proxy error");
    res.status(502).json({ error: "Proxy error" });
  }
});

export default router;
