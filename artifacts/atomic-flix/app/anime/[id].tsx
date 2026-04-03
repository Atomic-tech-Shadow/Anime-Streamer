import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useAnimeDetails, useEpisodes, useSeasons } from "@/hooks/useAnime";
import EpisodeItem from "@/components/EpisodeItem";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_H_PADDING = 16;
const SEASON_CARD_WIDTH = (SCREEN_WIDTH - CARD_H_PADDING * 2 - CARD_GAP) / 2;
const SEASON_CARD_HEIGHT = 130;

const LANGS = ["VOSTFR", "VF", "VF/VOSTFR"];

function getEpisodes(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.episodes) return data.episodes;
  if (data.results) return data.results;
  if (data.data) return Array.isArray(data.data) ? data.data : [];
  return [];
}

function getSeasons(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.seasons) return data.seasons;
  if (data.results) return data.results;
  return [];
}

export default function AnimeDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const { id, title: paramTitle, image: paramImage } = useLocalSearchParams<{
    id: string;
    title: string;
    image: string;
  }>();

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedLang, setSelectedLang] = useState("VOSTFR");

  const { data: details } = useAnimeDetails(id ?? "");
  const { data: seasonsData } = useSeasons(id ?? "");
  const { data: episodesData, isLoading: loadingEpisodes } = useEpisodes(
    id ?? "",
    selectedSeason,
    selectedLang
  );

  const anime = details ?? {};
  const title = anime.title ?? paramTitle ?? "Anime";
  const image = anime.image ?? anime.cover ?? anime.thumbnail ?? paramImage ?? "";
  const synopsis = anime.synopsis ?? anime.description ?? "";
  const genres: string[] = anime.genres ?? [];
  const type = anime.type ?? "";
  const status = anime.status ?? "";

  const seasons = getSeasons(seasonsData);
  const episodes = getEpisodes(episodesData);

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  const handleSeasonPress = (num: number) => {
    setSelectedSeason(num);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const handleEpisodePress = (ep: any) => {
    const epUrl = ep.url ?? ep.link ?? ep.stream ?? "";
    if (epUrl) {
      router.push({
        pathname: "/player",
        params: {
          url: epUrl,
          title,
          image,
          season: String(selectedSeason),
          episodeNum: String(ep.number ?? ep.episode ?? "?"),
          animeId: id ?? "",
          language: selectedLang,
        },
      });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 40 },
        ]}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          {image ? (
            <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />
          )}
          <LinearGradient
            colors={["rgba(8,8,15,0.1)", "rgba(8,8,15,0.95)"]}
            style={StyleSheet.absoluteFill}
          />
          {/* Back */}
          <TouchableOpacity
            style={[styles.backBtn, { top: topPadding + 12, backgroundColor: "rgba(0,0,0,0.5)" }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          {/* Content at bottom of hero */}
          <View style={styles.heroContent}>
            {/* Genres */}
            {genres.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genreList}
                style={{ marginBottom: 10 }}
              >
                {genres.map((g, i) => (
                  <View
                    key={i}
                    style={[styles.genreBadge, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.25)" }]}
                  >
                    <Text style={[styles.genreText, { color: "rgba(255,255,255,0.85)" }]}>{g}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <Text style={styles.heroTitle} numberOfLines={2}>{title}</Text>
            <View style={styles.metaRow}>
              {type ? (
                <View style={[styles.metaBadge, { backgroundColor: colors.neonPurple + "33" }]}>
                  <Text style={[styles.metaBadgeText, { color: colors.neonPurple }]}>{type}</Text>
                </View>
              ) : null}
              {status ? (
                <View style={[styles.metaBadge, { backgroundColor: colors.neonBlue + "33" }]}>
                  <Text style={[styles.metaBadgeText, { color: colors.neonBlue }]}>{status}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Synopsis ── */}
        {synopsis ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📺</Text>
              <Text style={[styles.sectionTitle, { color: colors.neonBlue }]}>Synopsis</Text>
            </View>
            <View style={[styles.synopsisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.synopsisText, { color: colors.foreground }]}>
                {synopsis}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Saisons et Films ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎬</Text>
            <Text style={[styles.sectionTitle, { color: colors.neonBlue }]}>Saisons et Films</Text>
          </View>

          {seasons.length === 0 ? (
            // Fallback: single season card
            <View style={styles.seasonGrid}>
              <TouchableOpacity
                onPress={() => handleSeasonPress(1)}
                activeOpacity={0.85}
                style={[
                  styles.seasonCard,
                  { borderColor: selectedSeason === 1 ? colors.neonBlue : colors.border },
                ]}
              >
                {image ? (
                  <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />
                )}
                <LinearGradient
                  colors={["transparent", "rgba(8,8,15,0.82)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.seasonCardContent}>
                  <Text style={styles.seasonCardTitle}>Saison 1</Text>
                  <View style={styles.seasonTypeBadge}>
                    <Text style={[styles.seasonTypeText, { color: colors.neonBlue }]}>📺 SÉRIE</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.seasonGrid}>
              {seasons.map((s: any, i: number) => {
                const num = s.number ?? i + 1;
                const name = s.name ?? `Saison ${num}`;
                const isSelected = selectedSeason === num;
                return (
                  <TouchableOpacity
                    key={String(i)}
                    onPress={() => handleSeasonPress(num)}
                    activeOpacity={0.85}
                    style={[
                      styles.seasonCard,
                      { borderColor: isSelected ? colors.neonBlue : colors.border },
                    ]}
                  >
                    {image ? (
                      <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />
                    )}
                    <LinearGradient
                      colors={["transparent", "rgba(8,8,15,0.85)"]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.seasonCardContent}>
                      <Text style={styles.seasonCardTitle}>{name}</Text>
                      <View style={styles.seasonTypeBadge}>
                        <Text style={[styles.seasonTypeText, { color: colors.neonBlue }]}>
                          📺 {type ? type.toUpperCase() : "SÉRIE"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Episodes ── */}
        <View style={styles.section}>
          {/* Lang selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langList}
            style={{ marginBottom: 16 }}
          >
            {LANGS.map((lang) => {
              const isActive = selectedLang === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => setSelectedLang(lang)}
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor: isActive ? colors.neonBlue : colors.card,
                      borderColor: isActive ? colors.neonBlue : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.langBtnText, { color: isActive ? colors.background : colors.mutedForeground }]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loadingEpisodes ? (
            <View style={styles.loadState}>
              <Text style={[styles.loadText, { color: colors.mutedForeground }]}>
                Chargement des épisodes…
              </Text>
            </View>
          ) : episodes.length === 0 ? (
            <View style={styles.emptyEp}>
              <Feather name="film" size={34} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun épisode</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Essaie une autre saison ou langue
              </Text>
            </View>
          ) : (
            <View>
              <Text style={[styles.epCount, { color: colors.mutedForeground }]}>
                {episodes.length} épisode{episodes.length > 1 ? "s" : ""}
              </Text>
              {episodes.map((ep: any, i: number) => (
                <EpisodeItem
                  key={ep.url ?? ep.id ?? String(i)}
                  number={ep.number ?? ep.episode ?? i + 1}
                  title={ep.title}
                  thumbnail={ep.thumbnail ?? ep.image}
                  onPress={() => handleEpisodePress(ep)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    height: 320,
    justifyContent: "flex-end",
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaRow: { flexDirection: "row", gap: 8 },
  metaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  metaBadgeText: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 0.3 },
  genreList: { gap: 8, paddingRight: 4 },
  genreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  genreText: { fontSize: 11 },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 0.2,
  },

  // Synopsis
  synopsisCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  synopsisText: {
    fontSize: 14,
    lineHeight: 23,
  },

  // Season cards
  seasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  seasonCard: {
    width: SEASON_CARD_WIDTH,
    height: SEASON_CARD_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  seasonCardContent: {
    padding: 10,
  },
  seasonCardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800" as const,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  seasonTypeBadge: {
    marginTop: 3,
  },
  seasonTypeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },

  // Lang
  langList: { gap: 8, paddingRight: 4 },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  langBtnText: { fontSize: 12, fontWeight: "600" as const },

  // Episodes
  loadState: { alignItems: "center", paddingTop: 30 },
  loadText: { fontSize: 14 },
  emptyEp: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" as const },
  emptyText: { fontSize: 13, textAlign: "center" },
  epCount: { fontSize: 13, marginBottom: 12 },
});
