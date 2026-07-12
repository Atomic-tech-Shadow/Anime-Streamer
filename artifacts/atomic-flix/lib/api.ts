const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
const BASE_URL = DOMAIN
  ? `https://${DOMAIN}/api/anime-proxy`
  : "https://anime-sama-scraper.vercel.app/api";

export interface Anime {
  id: string;
  title: string;
  image?: string;
  cover?: string;
  thumbnail?: string;
  description?: string;
  synopsis?: string;
  genres?: string[];
  type?: string;
  status?: string;
  rating?: number;
  year?: number;
  episodes?: number;
  url?: string;
}

export interface Episode {
  id?: string;
  number?: number;
  title?: string;
  url?: string;
  thumbnail?: string;
  date?: string;
}

export interface Season {
  id?: string;
  name?: string;
  number?: number;
  languages?: string[];
  url?: string;
  value?: string;
  type?: string;
  contentType?: string;
}

export interface PlanningEntry {
  title?: string;
  time?: string;
  anime?: Anime;
  id?: string;
  image?: string;
  url?: string;
  day?: string;
}

export interface EpisodeSource {
  url?: string;
  server?: string;
  quality?: string;
  embed?: string;
}

export interface ScanChapterMeta {
  number: number;
  title?: string;
  pageCount?: number;
}

export interface ScanChaptersResponse {
  realName?: string;
  count?: number;
  chapters: ScanChapterMeta[];
  language?: string;
  season?: string;
}

export interface ScanChapterFull {
  number: number;
  title?: string;
  pageCount: number;
  images: string[];
}

export interface ScanChapterResponse {
  chapter: ScanChapterFull;
  realName?: string;
  language?: string;
  season?: string;
}

/** Fusionne les genres fragmentés par l'API (ex: ["Science","fiction"] → ["Science-fiction"]) */
function fixGenres(genres: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < genres.length; i++) {
    const cur = genres[i];
    const next = genres[i + 1];
    // Si le fragment suivant commence par une minuscule, c'est la suite du précédent
    if (next && /^[a-zàâçéèêëîïôùûü]/.test(next)) {
      result.push(cur + "-" + next);
      i++; // saute le fragment suivant
    } else {
      result.push(cur);
    }
  }
  return result;
}

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  // Corrige les genres fragmentés si présents
  if (data && Array.isArray(data.genres)) {
    data.genres = fixGenres(data.genres);
  }
  return data;
}

export const api = {
  search: (query: string) =>
    fetchAPI<any>(`/search?query=${encodeURIComponent(query)}`),

  recent: () => fetchAPI<any>(`/recent`),

  planning: (day: string = "today") =>
    fetchAPI<any>(`/planning?day=${day}`),

  popular: () => fetchAPI<any>(`/popular`),

  recommendations: () => fetchAPI<any>(`/recommendations`),

  animeDetails: (animeId: string) =>
    fetchAPI<any>(`/anime/${encodeURIComponent(animeId)}`),

  seasons: (animeId: string) =>
    fetchAPI<any>(`/seasons/${encodeURIComponent(animeId)}`),

  episodes: (animeId: string, season: string | number = 1, language: string = "VOSTFR") =>
    fetchAPI<any>(`/episodes/${encodeURIComponent(animeId)}?season=${encodeURIComponent(String(season))}&language=${language}&includeSources=true`),

  embed: (animeUrl: string) =>
    fetchAPI<any>(`/embed?url=${encodeURIComponent(animeUrl)}`),

  // ── Scans (manga / webtoon) ────────────────────────────────────────────────
  // Liste légère des chapitres (pas d'images chargées)
  scanChapters: (animeId: string, language: string = "VF", season: string = "scan") =>
    fetchAPI<ScanChaptersResponse>(
      `/episodes/${encodeURIComponent(animeId)}?season=${encodeURIComponent(season)}&language=${encodeURIComponent(language)}`
    ),

  // Charge les images d'un chapitre précis
  scanChapter: (
    animeId: string,
    chapter: number | string,
    language: string = "VF",
    season: string = "scan"
  ) =>
    fetchAPI<ScanChapterResponse>(
      `/episodes/${encodeURIComponent(animeId)}?season=${encodeURIComponent(season)}&language=${encodeURIComponent(language)}&chapter=${encodeURIComponent(String(chapter))}`
    ),
};
