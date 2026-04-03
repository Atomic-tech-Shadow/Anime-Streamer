import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAnimeDetails, useEpisodes, useSeasons } from "@/hooks/useAnime";
import EpisodeItem from "@/components/EpisodeItem";

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
  const { id, title: paramTitle, image: paramImage } = useLocalSearchParams<{
    id: string;
    title: string;
    image: string;
  }>();

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedLang, setSelectedLang] = useState("VOSTFR");

  const { data: details, isLoading: loadingDetails } = useAnimeDetails(id ?? "");
  const { data: seasonsData } = useSeasons(id ?? "");
  const { data: episodesData, isLoading: loadingEpisodes } = useEpisodes(
    id ?? "",
    selectedSeason,
    selectedLang
  );

  const anime = details ?? {};
  const title =
    anime.title ?? paramTitle ?? "Anime";
  const image =
    anime.image ?? anime.cover ?? anime.thumbnail ?? paramImage ?? "";
  const synopsis = anime.synopsis ?? anime.description ?? "";
  const genres: string[] = anime.genres ?? [];
  const type = anime.type ?? "";
  const status = anime.status ?? "";

  const seasons = getSeasons(seasonsData);
  const episodes = getEpisodes(episodesData);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.heroContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[styles.heroImage, { backgroundColor: colors.secondary }]}
            />
          )}
          <View
            style={[
              styles.heroOverlay,
              { backgroundColor: "rgba(8,8,15,0.5)" },
            ]}
          />
          <View
            style={[
              styles.heroBottom,
              { backgroundColor: colors.background },
            ]}
          />
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.overlay,
                borderColor: colors.border,
                top: topPadding + 8,
              },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>

          <View style={styles.metaRow}>
            {type ? (
              <View
                style={[
                  styles.metaBadge,
                  { backgroundColor: colors.neonPurple + "22" },
                ]}
              >
                <Text
                  style={[styles.metaBadgeText, { color: colors.neonPurple }]}
                >
                  {type}
                </Text>
              </View>
            ) : null}
            {status ? (
              <View
                style={[
                  styles.metaBadge,
                  { backgroundColor: colors.neonBlue + "22" },
                ]}
              >
                <Text
                  style={[styles.metaBadgeText, { color: colors.neonBlue }]}
                >
                  {status}
                </Text>
              </View>
            ) : null}
          </View>

          {genres.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.genreScroll}
              contentContainerStyle={styles.genreList}
            >
              {genres.map((g, i) => (
                <View
                  key={i}
                  style={[
                    styles.genreBadge,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.genreText, { color: colors.mutedForeground }]}
                  >
                    {g}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          {synopsis ? (
            <Text style={[styles.synopsis, { color: colors.mutedForeground }]}>
              {synopsis}
            </Text>
          ) : null}
        </View>

        <View style={styles.episodesSection}>
          {seasons.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.langList}
              style={{ marginBottom: 12 }}
            >
              {seasons.map((s, i) => {
                const num = s.number ?? i + 1;
                return (
                  <TouchableOpacity
                    key={String(i)}
                    onPress={() => setSelectedSeason(num)}
                    style={[
                      styles.langBtn,
                      {
                        backgroundColor:
                          selectedSeason === num
                            ? colors.neonPurple
                            : colors.card,
                        borderColor:
                          selectedSeason === num
                            ? colors.neonPurple
                            : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.langBtnText,
                        {
                          color:
                            selectedSeason === num
                              ? "#fff"
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      Saison {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langList}
            style={{ marginBottom: 16 }}
          >
            {LANGS.map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setSelectedLang(lang)}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor:
                      selectedLang === lang ? colors.neonBlue : colors.card,
                    borderColor:
                      selectedLang === lang ? colors.neonBlue : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    {
                      color:
                        selectedLang === lang ? colors.background : colors.mutedForeground,
                    },
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loadingEpisodes ? (
            <View style={styles.loadState}>
              <Text style={[styles.loadText, { color: colors.mutedForeground }]}>
                Chargement des épisodes...
              </Text>
            </View>
          ) : episodes.length === 0 ? (
            <View style={styles.emptyEp}>
              <Feather name="film" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Aucun épisode disponible
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Essaie une autre saison ou langue
              </Text>
            </View>
          ) : (
            <View>
              <Text
                style={[styles.epCount, { color: colors.mutedForeground }]}
              >
                {episodes.length} épisode{episodes.length > 1 ? "s" : ""}
              </Text>
              {episodes.map((ep, i) => (
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
  heroContainer: {
    height: 280,
    position: "relative",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    opacity: 1,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  info: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, marginBottom: 10 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  metaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  metaBadgeText: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 0.3 },
  genreScroll: { marginBottom: 14 },
  genreList: { gap: 8 },
  genreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  genreText: { fontSize: 11 },
  synopsis: { fontSize: 14, lineHeight: 22 },
  episodesSection: { paddingTop: 8, paddingHorizontal: 16 },
  langList: { gap: 8, paddingRight: 4 },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  langBtnText: { fontSize: 12, fontWeight: "600" as const },
  loadState: { alignItems: "center", paddingTop: 30 },
  loadText: { fontSize: 14 },
  emptyEp: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" as const },
  emptyText: { fontSize: 13, textAlign: "center" },
  epCount: { fontSize: 13, marginBottom: 12, marginLeft: 0 },
});
