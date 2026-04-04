import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useSeasons } from "@/hooks/useAnime";
import LoadingScreen from "@/components/LoadingScreen";
import SkeletonCard from "@/components/SkeletonCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP       = 12;
const CARD_H_PADDING = 16;
const SEASON_CARD_WIDTH  = (SCREEN_WIDTH - CARD_H_PADDING * 2 - CARD_GAP) / 2;
const SEASON_CARD_HEIGHT = 140;

const FLAG_BASE = "https://raw.githubusercontent.com/Anime-Sama/IMG/img/autres";
const LANG_FLAG_URL: Record<string, string> = {
  VOSTFR: `${FLAG_BASE}/flag_jp.png`,
  VO:     `${FLAG_BASE}/flag_jp.png`,
  VF:     `${FLAG_BASE}/flag_fr.png`,
  VF1:    `${FLAG_BASE}/flag_fr.png`,
  VF2:    `${FLAG_BASE}/flag_fr.png`,
  VA:     `${FLAG_BASE}/flag_en.png`,
  VAR:    `${FLAG_BASE}/flag_ar.png`,
  VKR:    `${FLAG_BASE}/flag_kr.png`,
  VCN:    `${FLAG_BASE}/flag_cn.png`,
  VQC:    `${FLAG_BASE}/flag_qc.png`,
};

function getSeasons(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.seasons) return data.seasons;
  if (data.results) return data.results;
  return [];
}

function SeasonCard({ image, name, langs, seasonType, onPress, colors }: {
  image: string; name: string; langs: string[]; seasonType: string;
  onPress: () => void; colors: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.seasonCard, { transform: [{ scale }] }]}>
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} cachePolicy="memory-disk" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
        )}
        <LinearGradient colors={["rgba(8,8,15,0.1)", "rgba(8,8,15,0.88)"]} style={StyleSheet.absoluteFill} />

        {langs.length > 0 && (
          <View style={styles.langBadgeRow}>
            {langs.slice(0, 4).map((l) =>
              LANG_FLAG_URL[l] ? (
                <Image key={l} source={{ uri: LANG_FLAG_URL[l] }} style={styles.langBadgeFlagImg} contentFit="cover" cachePolicy="memory-disk" />
              ) : null
            )}
          </View>
        )}

        <View style={styles.seasonCardContent}>
          <Text style={styles.seasonCardTitle} numberOfLines={1}>{name}</Text>
          {seasonType ? (
            <View style={styles.seasonCardMeta}>
              <Feather name="play-circle" size={10} color="rgba(255,255,255,0.55)" />
              <Text style={styles.seasonCardMetaText}>{seasonType.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AnimeDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { id, title: paramTitle, image: paramImage } = useLocalSearchParams<{
    id: string; title: string; image: string;
  }>();

  const { data: seasonsData, isLoading } = useSeasons(id ?? "");

  const seasMeta = seasonsData as any;
  const title    = seasMeta?.title ?? paramTitle ?? "Anime";
  const image    = seasMeta?.image ?? paramImage ?? "";
  const synopsis = seasMeta?.synopsis ?? seasMeta?.description ?? "";
  const genres: string[] = seasMeta?.genres ?? [];
  const type     = seasMeta?.type ?? "";
  const status   = seasMeta?.status ?? "";
  const year     = seasMeta?.year ?? null;
  const studio   = seasMeta?.studio ?? null;

  const seasons = getSeasons(seasonsData);

  const handleSeasonPress = (num: number) => {
    const seasonData = seasons.find((s: any) => s.number === num);
    const langs: string[] = seasonData?.languages ?? [];
    const initialLang = langs[0] ?? "VOSTFR";
    router.push({
      pathname: "/player",
      params: {
        url: "", title, image,
        season: String(num), episodeNum: "1",
        animeId: id ?? "",
        language: initialLang,
        availableLanguages: langs.join(","),
      },
    });
  };

  if (isLoading && !paramTitle) {
    return <LoadingScreen label="Chargement" />;
  }

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
            <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} cachePolicy="memory-disk" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          )}
          <LinearGradient
            colors={["rgba(8,8,15,0)", "rgba(8,8,15,0.55)", "rgba(8,8,15,0.98)"]}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroContent}>
            {/* Genre pills */}
            {genres.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genreList}
                style={{ marginBottom: 12 }}
              >
                {genres.map((g, i) => (
                  <View key={i} style={[styles.genreBadge, { backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.18)" }]}>
                    <Text style={styles.genreText}>{g}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <Text style={styles.heroTitle} numberOfLines={2}>{title}</Text>

            {/* Meta badges */}
            <View style={styles.metaRow}>
              {type ? (
                <View style={[styles.metaBadge, { backgroundColor: colors.neonPurple + "28", borderColor: colors.neonPurple + "44" }]}>
                  <Feather name="tv" size={10} color={colors.neonPurple} />
                  <Text style={[styles.metaBadgeText, { color: colors.neonPurple }]}>{type}</Text>
                </View>
              ) : null}
              {status ? (
                <View style={[styles.metaBadge, { backgroundColor: colors.neonBlue + "28", borderColor: colors.neonBlue + "44" }]}>
                  <Feather name="activity" size={10} color={colors.neonBlue} />
                  <Text style={[styles.metaBadgeText, { color: colors.neonBlue }]}>{status}</Text>
                </View>
              ) : null}
              {year ? (
                <View style={[styles.metaBadge, { backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.18)" }]}>
                  <Feather name="calendar" size={10} color="rgba(255,255,255,0.7)" />
                  <Text style={[styles.metaBadgeText, { color: "rgba(255,255,255,0.7)" }]}>{year}</Text>
                </View>
              ) : null}
              {studio ? (
                <View style={[styles.metaBadge, { backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.18)" }]}>
                  <Feather name="film" size={10} color="rgba(255,255,255,0.7)" />
                  <Text style={[styles.metaBadgeText, { color: "rgba(255,255,255,0.7)" }]}>{studio}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Synopsis ── */}
        {synopsis ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: colors.neonBlue }]} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Synopsis</Text>
            </View>
            <View style={[styles.synopsisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.synopsisText, { color: colors.mutedForeground }]}>
                {synopsis}
              </Text>
            </View>
          </View>
        ) : null}


        {/* ── Saisons et Films ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: colors.neonPurple }]} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saisons & Films</Text>
          </View>

          <View style={styles.seasonGrid}>
            {isLoading ? (
              [0, 1].map((i) => (
                <SkeletonCard key={i} width={SEASON_CARD_WIDTH} height={SEASON_CARD_HEIGHT} />
              ))
            ) : seasons.map((s: any, i: number) => {
              const num = s.number ?? i + 1;
              const name = s.name ?? `Saison ${num}`;
              const langs: string[] = s.languages ?? [];
              const seasonType: string = s.type ?? "";
              return (
                <SeasonCard
                  key={String(i)}
                  image={image}
                  name={name}
                  langs={langs}
                  seasonType={seasonType}
                  onPress={() => handleSeasonPress(num)}
                  colors={colors}
                />
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

  hero: { height: 340, justifyContent: "flex-end", position: "relative" },
  heroContent: { paddingHorizontal: 18, paddingBottom: 22 },
  heroTitle: {
    color: "#fff", fontSize: 28, fontWeight: "800" as const,
    letterSpacing: -0.5, lineHeight: 34, marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  metaRow: { flexDirection: "row", gap: 8 },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  metaBadgeText: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.3 },
  genreList: { gap: 7, paddingRight: 4 },
  genreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  genreText: { fontSize: 11, color: "rgba(255,255,255,0.82)", fontWeight: "500" as const },

  section: { paddingHorizontal: 16, paddingTop: 26 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionAccent: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "800" as const, letterSpacing: -0.2 },

  synopsisCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  synopsisText: { fontSize: 14, lineHeight: 24 },

  seasonGrid: { flexDirection: "row", flexWrap: "wrap", gap: CARD_GAP },
  seasonCard: {
    width: SEASON_CARD_WIDTH, height: SEASON_CARD_HEIGHT,
    borderRadius: 14, overflow: "hidden", justifyContent: "flex-end",
  },
  langBadgeRow: {
    position: "absolute", top: 8, right: 8,
    flexDirection: "row", gap: 5, flexWrap: "wrap", justifyContent: "flex-end",
  },
  langBadgeFlagImg: { width: 26, height: 18, borderRadius: 3 },
  seasonCardContent: { padding: 11 },
  seasonCardTitle: {
    color: "#fff", fontSize: 13, fontWeight: "800" as const,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  seasonCardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  seasonCardMetaText: { color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "600" as const, letterSpacing: 0.5 },
});
