import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { usePopular, useRecent, useRecommendations } from "@/hooks/useAnime";
import AnimeCard from "@/components/AnimeCard";
import SectionHeader from "@/components/SectionHeader";
import SkeletonCard from "@/components/SkeletonCard";
import HeroBanner from "@/components/HeroBanner";
import NeonGlow from "@/components/NeonGlow";

function getPopularList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.categories && typeof data.categories === "object") {
    return Object.values(data.categories as Record<string, any[]>).flat();
  }
  if (data.results) return data.results;
  if (data.data) return Array.isArray(data.data) ? data.data : [];
  return [];
}

function getRecentList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.recentEpisodes) return data.recentEpisodes;
  if (data.results) return data.results;
  if (data.data) return Array.isArray(data.data) ? data.data : [];
  return [];
}

function getRecoList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data) return Array.isArray(data.data) ? data.data : [];
  if (data.results) return data.results;
  return [];
}

function getAnimeId(item: any): string {
  return item?.id ?? item?.animeId ?? item?.url ?? item?.title ?? item?.animeTitle ?? "";
}

function getAnimeImage(item: any): string | undefined {
  return item?.image ?? item?.cover ?? item?.thumbnail ?? item?.img;
}

function getAnimeTitle(item: any): string {
  return item?.title ?? item?.animeTitle ?? "";
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    data: popular,
    isLoading: loadingPopular,
    refetch: refetchPopular,
  } = usePopular();
  const {
    data: recent,
    isLoading: loadingRecent,
    refetch: refetchRecent,
  } = useRecent();
  const {
    data: recommendations,
    isLoading: loadingReco,
    refetch: refetchReco,
  } = useRecommendations();

  const popularList = getPopularList(popular);
  const recentList = getRecentList(recent);
  const recoList = getRecoList(recommendations);

  const featured = popularList[0] ?? recentList[0];

  const refreshing = loadingPopular && loadingRecent;

  const handleAnimePress = (item: any) => {
    const id = getAnimeId(item);
    if (id) {
      router.push({
        pathname: "/anime/[id]",
        params: { id, title: getAnimeTitle(item), image: getAnimeImage(item) ?? "" },
      });
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NeonGlow
        color={colors.neonPurple}
        size={300}
        style={{ top: -60, left: -80 }}
      />
      <NeonGlow
        color={colors.neonBlue}
        size={200}
        style={{ top: 100, right: -60 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPadding + 8, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refetchPopular();
              refetchRecent();
              refetchReco();
            }}
            tintColor={colors.neonPurple}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.logoText, { color: colors.neonPurple }]}>
              ATOMIC
            </Text>
            <Text style={[styles.logoFlix, { color: colors.foreground }]}>
              FLIX
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/search")}
            style={[
              styles.searchBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
          >
            <Feather name="search" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {featured && (
          <HeroBanner
            title={getAnimeTitle(featured)}
            image={getAnimeImage(featured)}
            type={featured.type ?? featured.category}
            onPress={() => handleAnimePress(featured)}
          />
        )}

        <View style={styles.section}>
          <SectionHeader
            title="Tendances"
            accent
            onSeeAll={() => router.push("/search")}
          />
          {loadingPopular ? (
            <FlatList
              data={[1, 2, 3, 4]}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.list}
              keyExtractor={(i) => String(i)}
              renderItem={() => <SkeletonCard width={140} height={198} />}
            />
          ) : (
            <FlatList
              data={popularList.slice(0, 12)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.list}
              keyExtractor={(item, i) => getAnimeId(item) || String(i)}
              renderItem={({ item }) => (
                <AnimeCard
                  title={getAnimeTitle(item)}
                  image={getAnimeImage(item)}
                  type={item.type ?? item.category}
                  onPress={() => handleAnimePress(item)}
                  badge={item.type ?? item.category}
                />
              )}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Ajouts récents" accent />
          {loadingRecent ? (
            <FlatList
              data={[1, 2, 3, 4]}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.list}
              keyExtractor={(i) => String(i)}
              renderItem={() => <SkeletonCard width={110} height={155} />}
            />
          ) : (
            <FlatList
              data={recentList.slice(0, 15)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.list}
              keyExtractor={(item, i) => getAnimeId(item) || String(i)}
              renderItem={({ item }) => (
                <AnimeCard
                  title={getAnimeTitle(item)}
                  image={getAnimeImage(item)}
                  episode={item.episode ?? item.number}
                  size="small"
                  onPress={() => handleAnimePress(item)}
                />
              )}
            />
          )}
        </View>

        {recoList.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Recommandations" accent />
            <FlatList
              data={recoList.slice(0, 12)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.list}
              keyExtractor={(item, i) => getAnimeId(item) || String(i)}
              renderItem={({ item }) => (
                <AnimeCard
                  title={getAnimeTitle(item)}
                  image={getAnimeImage(item)}
                  type={item.type ?? item.contentType}
                  onPress={() => handleAnimePress(item)}
                />
              )}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "900" as const,
    letterSpacing: 4,
    lineHeight: 26,
  },
  logoFlix: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 8,
    lineHeight: 16,
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  section: {
    marginBottom: 28,
  },
  list: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});
