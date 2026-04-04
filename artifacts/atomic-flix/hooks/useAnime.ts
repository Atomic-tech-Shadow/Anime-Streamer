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

export function needsEmbedEndpoint(seasonValue: string): boolean {
  return !/^saison\d/.test(seasonValue);
}

export function useEpisodes(animeId: string, season: string | number, language: string, enabled = true) {
  return useQuery({
    queryKey: ["episodes", animeId, season, language],
    queryFn: () => api.episodes(animeId, season, language),
    enabled: enabled && !!animeId && !!season,
    staleTime: 1000 * 60 * 5,
  });
}

export function useEmbedEpisodes(animeId: string, season: string, language: string, enabled = true) {
  return useQuery({
    queryKey: ["embed-episodes", animeId, season, language],
    queryFn: () => api.embedEpisodes(animeId, season, language),
    enabled: enabled && !!animeId && !!season,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSeasonEpisodes(animeId: string, season: string, language: string) {
  const isEmbed = needsEmbedEndpoint(season);
  const standard = useEpisodes(animeId, season, language, !isEmbed);
  const embed    = useEmbedEpisodes(animeId, season, language, isEmbed);
  return isEmbed ? embed : standard;
}
