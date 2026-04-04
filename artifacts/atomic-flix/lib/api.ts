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

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
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
    fetchAPI<any>(`/episodes/${encodeURIComponent(animeId)}?season=${encodeURIComponent(String(season))}&language=${language}`),

  embed: (animeUrl: string) =>
    fetchAPI<any>(`/embed?url=${encodeURIComponent(animeUrl)}`),
};
