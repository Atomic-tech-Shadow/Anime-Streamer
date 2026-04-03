import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const ANIME_API = "https://anime-sama-scraper.vercel.app";

router.use("/anime-proxy", async (req, res) => {
  const subPath = req.path;
  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  const url = `${ANIME_API}/api${subPath}${query ? `?${query}` : ""}`;

  const response = await fetch(url);

  if (!response.ok) {
    res.status(response.status).json({ error: "Upstream error", status: response.status });
    return;
  }

  const data = await response.json();
  res.json(data);
});

export default router;
