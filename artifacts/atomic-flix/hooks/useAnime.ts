import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const GC_TIME = 1000 * 60 * 30; // garde le cache 30 min en mémoire

export function useRecent() {
  return useQuery({
    queryKey: ["recent"],
    queryFn: () => api.recent(),
    staleTime: 1000 * 60 * 5,
    gcTime: GC_TIME,
    retry: 1,
  });
}

export function usePopular() {
  return useQuery({
    queryKey: ["popular"],
    queryFn: () => api.popular(),
    staleTime: 1000 * 60 * 10,
    gcTime: GC_TIME,
    retry: 1,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.recommendations(),
    staleTime: 1000 * 60 * 10,
    gcTime: GC_TIME,
    retry: 1,
  });
}

export function usePlanning(day: string = "today") {
  return useQuery({
    queryKey: ["planning", day],
    queryFn: () => api.planning(day),
    staleTime: 1000 * 60 * 5,
    gcTime: GC_TIME,
    retry: 1,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: query.trim().length > 1,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    placeholderData: (prev: any) => prev, // évite le flash vide entre deux recherches
  });
}

export function useAnimeDetails(animeId: string) {
  return useQuery({
    queryKey: ["anime", animeId],
    queryFn: () => api.animeDetails(animeId),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 10,
    gcTime: GC_TIME,
    retry: 1,
  });
}

export function useSeasons(animeId: string) {
  return useQuery({
    queryKey: ["seasons", animeId],
    queryFn: () => api.seasons(animeId),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 10,
    gcTime: GC_TIME,
    retry: 1,
  });
}

export function useEpisodes(animeId: string, season: string | number, language: string, enabled = true) {
  return useQuery({
    queryKey: ["episodes", animeId, season, language],
    queryFn: () => api.episodes(animeId, season, language),
    enabled: enabled && !!animeId && !!season,
    staleTime: 1000 * 60 * 5,
    gcTime: GC_TIME,
    retry: 1,
  });
}

// L'API supporte désormais tous les types (saison, film, oav, kai…) via le même endpoint
export function useSeasonEpisodes(animeId: string, season: string, language: string) {
  return useEpisodes(animeId, season, language);
}

// ── Scans (manga / webtoon) ──────────────────────────────────────────────────
export function useScanChapters(
  animeId: string,
  language: string = "VF",
  season: string = "scan",
  enabled = true,
) {
  return useQuery({
    queryKey: ["scan-chapters", animeId, season, language],
    queryFn: () => api.scanChapters(animeId, language, season),
    enabled: enabled && !!animeId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useScanChapter(
  animeId: string,
  chapter: number | string | null | undefined,
  language: string = "VF",
  season: string = "scan",
  enabled = true,
) {
  return useQuery({
    queryKey: ["scan-chapter", animeId, season, language, String(chapter)],
    queryFn: () => api.scanChapter(animeId, chapter as number | string, language, season),
    enabled: enabled && !!animeId && chapter !== null && chapter !== undefined && chapter !== "",
    staleTime: 1000 * 60 * 30,
  });
}
