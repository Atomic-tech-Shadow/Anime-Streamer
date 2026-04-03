import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useRecent() {
  return useQuery({
    queryKey: ["recent"],
    queryFn: () => api.recent(),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePopular() {
  return useQuery({
    queryKey: ["popular"],
    queryFn: () => api.popular(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.recommendations(),
    staleTime: 1000 * 60 * 10,
  });
}

export function usePlanning(day: string = "today") {
  return useQuery({
    queryKey: ["planning", day],
    queryFn: () => api.planning(day),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: query.trim().length > 1,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAnimeDetails(animeId: string) {
  return useQuery({
    queryKey: ["anime", animeId],
    queryFn: () => api.animeDetails(animeId),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSeasons(animeId: string) {
  return useQuery({
    queryKey: ["seasons", animeId],
    queryFn: () => api.seasons(animeId),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useEpisodes(animeId: string, season: number, language: string) {
  return useQuery({
    queryKey: ["episodes", animeId, season, language],
    queryFn: () => api.episodes(animeId, season, language),
    enabled: !!animeId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useEpisodeSources(url: string) {
  return useQuery({
    queryKey: ["sources", url],
    queryFn: () => api.episodeSources(url),
    enabled: !!url,
    staleTime: 1000 * 60 * 5,
  });
}
