import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Dimensions,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { usePopular, useRecommendations, useSearch } from "@/hooks/useAnime";
import SkeletonCard from "@/components/SkeletonCard";
import NeonGlow from "@/components/NeonGlow";

const SCREEN_W = Dimensions.get("window").width;
const GRID_GAP = 12;
const GRID_PADDING = 16;
const CARD_W = (SCREEN_W - GRID_PADDING * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 1.45;

function getId(item: any): string {
  return item?.id ?? item?.animeId ?? item?.url ?? item?.title ?? "";
}
function getImage(item: any): string | undefined {
  return item?.image ?? item?.cover ?? item?.thumbnail ?? item?.img;
}
function getTitle(item: any): string {
  return item?.title ?? item?.animeTitle ?? "";
}

function dedupe(items: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const it of items) {
    const id = getId(it);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(it);
  }
  return out;
}

function getPopularList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.allPopular && Array.isArray(data.allPopular)) return data.allPopular;
  if (data.categories && typeof data.categories === "object") {
    return Object.values(data.categories as Record<string, any[]>).flat();
  }
  if (data.results) return data.results;
  return [];
}
function getRecoList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data) return Array.isArray(data.data) ? data.data : [];
  if (data.results) return data.results;
  return [];
}
function getSearchList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.results) return data.results;
  if (data.data) return Array.isArray(data.data) ? data.data : [];
  return [];
}

function ScanGridCard({
  title,
  image,
  type,
  onPress,
  colors,
}: {
  title: string;
  image?: string;
  type?: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      activeOpacity={0.85}
      style={[
        styles.card,
        { width: CARD_W, height: CARD_H, backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />
      )}

      {/* Scan badge */}
      <View style={[styles.scanBadge, { backgroundColor: colors.neonPurple }]}>
        <Feather name="book-open" size={9} color="#fff" />
        <Text style={styles.scanBadgeText}>SCAN</Text>
      </View>

      <LinearGradient
        colors={["transparent", "rgba(8,8,15,0.55)", "rgba(8,8,15,0.96)"]}
        locations={[0, 0.5, 1]}
        style={styles.cardGradient}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        {type ? (
          <Text style={styles.cardType} numberOfLines={1}>{type}</Text>
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function ScansScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const trimmed = search.trim();
  const isSearching = trimmed.length > 1;

  const {
    data: popular,
    isLoading: loadingPopular,
    refetch: refetchPopular,
  } = usePopular();

  const {
    data: reco,
    isLoading: loadingReco,
    refetch: refetchReco,
  } = useRecommendations();

  const {
    data: searchResults,
    isLoading: loadingSearch,
  } = useSearch(trimmed);

  const merged = useMemo(() => {
    if (isSearching) return getSearchList(searchResults);
    return dedupe([
      ...getPopularList(popular),
      ...getRecoList(reco),
    ]);
  }, [popular, reco, searchResults, isSearching]);

  const refreshing = loadingPopular && loadingReco;

  const handlePress = (item: any) => {
    const id = getId(item);
    if (!id) return;
    router.push({
      pathname: "/scan/[id]",
      params: {
        id,
        season: "scan",
        language: "VF",
        availableLanguages: "VF",
        title: getTitle(item),
        image: getImage(item) ?? "",
      },
    });
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const isInitialLoad = (loadingPopular || loadingReco) && merged.length === 0 && !isSearching;
  const isSearchLoading = isSearching && loadingSearch;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NeonGlow color={colors.neonPurple} size={280} style={{ top: -40, right: -90 }} />
      <NeonGlow color={colors.neonBlue} size={200} style={{ top: 140, left: -70 }} />

      <FlatList
        data={isInitialLoad || isSearchLoading ? [1, 2, 3, 4, 5, 6] : merged}
        keyExtractor={(item, i) =>
          typeof item === "number" ? `skel-${i}` : `scan-${i}-${getId(item)}`
        }
        numColumns={2}
        columnWrapperStyle={{ gap: GRID_GAP, paddingHorizontal: GRID_PADDING }}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        contentContainerStyle={{
          paddingTop: topPadding + 8,
          paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && !isInitialLoad}
            onRefresh={() => {
              refetchPopular();
              refetchReco();
            }}
            tintColor={colors.neonPurple}
          />
        }
        ListHeaderComponent={
          <View>
            {/* ── Header ─────────────────────────────────────────────── */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.neonPurple + "1F", borderColor: colors.neonPurple + "55" }]}>
                    <Feather name="book-open" size={16} color={colors.neonPurple} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                      Mangas & Scans
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                      Lis tes scans préférés en VF
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Search ─────────────────────────────────────────────── */}
            <View style={styles.searchWrap}>
              <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="search" size={15} color={colors.mutedForeground} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher un manga…"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                  keyboardType="default"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
                    <Feather name="x-circle" size={15} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* ── Section title ──────────────────────────────────────── */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: colors.neonPurple }]} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {isSearching ? "Résultats" : "Tous les scans"}
              </Text>
              {!isSearching && merged.length > 0 ? (
                <View style={[styles.countPill, { backgroundColor: colors.neonPurple + "1A", borderColor: colors.neonPurple + "44" }]}>
                  <Text style={[styles.countPillText, { color: colors.neonPurple }]}>{merged.length}</Text>
                </View>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (typeof item === "number") {
            return <SkeletonCard width={CARD_W} height={CARD_H} />;
          }
          return (
            <ScanGridCard
              title={getTitle(item)}
              image={getImage(item)}
              type={item.type ?? item.category}
              onPress={() => handlePress(item)}
              colors={colors}
            />
          );
        }}
        ListEmptyComponent={
          !isInitialLoad && !isSearchLoading ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.neonPurple + "14", borderColor: colors.neonPurple + "33" }]}>
                <Feather name="inbox" size={22} color={colors.neonPurple} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {isSearching ? "Aucun résultat" : "Aucun scan disponible"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {isSearching
                  ? "Essaye un autre nom de manga."
                  : "Reviens plus tard pour découvrir de nouveaux scans."}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: 16, marginBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20, fontWeight: "800" as const, letterSpacing: -0.4, lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 12, fontWeight: "500" as const, marginTop: 2,
  },

  searchWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 6,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 4 },

  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, marginBottom: 14,
  },
  sectionAccent: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "800" as const, letterSpacing: -0.2 },
  countPill: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1,
    marginLeft: 4,
  },
  countPillText: { fontSize: 11, fontWeight: "800" as const, letterSpacing: 0.3 },

  card: {
    borderRadius: 14, overflow: "hidden", borderWidth: 1,
    justifyContent: "flex-end", position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  scanBadge: {
    position: "absolute", top: 8, left: 8,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 4,
    borderRadius: 8, zIndex: 2,
  },
  scanBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" as const, letterSpacing: 0.6 },

  cardGradient: {
    paddingTop: 28, paddingHorizontal: 10, paddingBottom: 10,
  },
  cardTitle: {
    color: "#fff", fontSize: 13, fontWeight: "800" as const,
    lineHeight: 16, letterSpacing: -0.1,
  },
  cardType: {
    color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "600" as const,
    marginTop: 3, letterSpacing: 0.3,
  },

  emptyState: {
    alignItems: "center", justifyContent: "center", padding: 32, gap: 10,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "700" as const },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
});
