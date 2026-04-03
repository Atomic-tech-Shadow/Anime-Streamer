import React from "react";
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
import { useAnimeDetails, useSeasons } from "@/hooks/useAnime";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_H_PADDING = 16;
const SEASON_CARD_WIDTH = (SCREEN_WIDTH - CARD_H_PADDING * 2 - CARD_GAP) / 2;
const SEASON_CARD_HEIGHT = 130;

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

  const { id, title: paramTitle, image: paramImage } = useLocalSearchParams<{
    id: string;
    title: string;
    image: string;
  }>();

  const { data: details } = useAnimeDetails(id ?? "");
  const { data: seasonsData } = useSeasons(id ?? "");

  const anime = details ?? {};
  const title = anime.title ?? paramTitle ?? "Anime";
  const image = anime.image ?? anime.cover ?? anime.thumbnail ?? paramImage ?? "";
  const synopsis = anime.synopsis ?? anime.description ?? "";
  const genres: string[] = anime.genres ?? [];
  const type = anime.type ?? "";
  const status = anime.status ?? "";

  const seasons = getSeasons(seasonsData);

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  const handleSeasonPress = (num: number) => {
    const seasonData = seasons.find((s: any) => s.number === num);
    const langs: string[] = seasonData?.languages ?? [];
    const initialLang = langs[0] ?? "VOSTFR";
    router.push({
      pathname: "/player",
      params: {
        url: "",
        title,
        image,
        season: String(num),
        episodeNum: "1",
        animeId: id ?? "",
        language: initialLang,
        availableLanguages: langs.join(","),
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
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
          <TouchableOpacity
            style={[styles.backBtn, { top: topPadding + 12, backgroundColor: "rgba(0,0,0,0.5)" }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
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

          <View style={styles.seasonGrid}>
            {(seasons.length === 0 ? [{ number: 1, name: "Saison 1" }] : seasons).map((s: any, i: number) => {
              const num = s.number ?? i + 1;
              const name = s.name ?? `Saison ${num}`;
              return (
                <TouchableOpacity
                  key={String(i)}
                  onPress={() => handleSeasonPress(num)}
                  activeOpacity={0.82}
                  style={[styles.seasonCard, { borderColor: colors.neonBlue }]}
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
                    <Text style={[styles.seasonTypeText, { color: colors.neonBlue }]}>
                      📺 {type ? type.toUpperCase() : "SÉRIE"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
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
  genreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  genreText: { fontSize: 11 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "800" as const, letterSpacing: 0.2 },
  synopsisCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  synopsisText: { fontSize: 14, lineHeight: 23 },
  seasonGrid: { flexDirection: "row", flexWrap: "wrap", gap: CARD_GAP },
  seasonCard: {
    width: SEASON_CARD_WIDTH,
    height: SEASON_CARD_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  seasonCardContent: { padding: 10 },
  seasonCardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800" as const,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  seasonTypeText: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.5, marginTop: 3 },
});
