import React, { useRef, useState, useEffect, useMemo } from "react";
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
  Animated,
  PanResponder,
  Dimensions,
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
import LoadingScreen from "@/components/LoadingScreen";

const SCREEN_W = Dimensions.get("window").width;

function getPopularList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.allPopular && Array.isArray(data.allPopular)) return data.allPopular;
  if (data.categories && typeof data.categories === "object") {
    return Object.values(data.categories as Record<string, any[]>).flat();
  }
  if (data.results) return data.results;
  if (data.data) return Array.isArray(data.data) ? data.data : [];
  return [];
}

function getPepitesList(data: any): any[] {
  if (!data?.categories?.pepites) return [];
  return Array.isArray(data.categories.pepites) ? data.categories.pepites : [];
}

function getClassiquesList(data: any): any[] {
  if (!data?.categories?.classiques) return [];
  return Array.isArray(data.categories.classiques) ? data.categories.classiques : [];
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
  const pepitesList = getPepitesList(popular);
  const classiquesList = getClassiquesList(popular);
  const recentList = getRecentList(recent);
  const recoList = getRecoList(recommendations);

  const featuredList = useMemo(() => {
    const combined: any[] = [];
    const max = Math.max(pepitesList.length, classiquesList.length);
    for (let i = 0; i < max; i++) {
      if (pepitesList[i]) combined.push(pepitesList[i]);
      if (classiquesList[i]) combined.push(classiquesList[i]);
    }
    return combined.slice(0, 10);
  }, [pepitesList, classiquesList]);

  const [featuredIndex, setFeaturedIndex] = useState(0);
  const fadeAnim      = useRef(new Animated.Value(1)).current;
  const slideAnim     = useRef(new Animated.Value(0)).current;
  const indexRef      = useRef(0);
  const listLenRef    = useRef(0);
  const animatingRef  = useRef(false);

  indexRef.current   = featuredIndex;
  listLenRef.current = featuredList.length;

  const goToIndex = useRef((next: number, direction: 1 | -1) => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    const outX = -direction * SCREEN_W * 0.4;
    const inX  =  direction * SCREEN_W * 0.4;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: outX, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(inX);
      setFeaturedIndex(next);
      indexRef.current = next;
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start(() => { animatingRef.current = false; });
    });
  }).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        const len = listLenRef.current;
        if (len <= 1) return;
        if (g.dx < -40) {
          goToIndex((indexRef.current + 1) % len, 1);
        } else if (g.dx > 40) {
          goToIndex((indexRef.current - 1 + len) % len, -1);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (featuredList.length <= 1) return;
    const interval = setInterval(() => {
      const len = listLenRef.current;
      goToIndex((indexRef.current + 1) % len, 1);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredList.length]);

  const featured = featuredList[featuredIndex] ?? popularList[0] ?? recentList[0];

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

  // For recent episodes: go directly to the player at the right episode + language
  const handleRecentPress = (item: any) => {
    const id = item.animeId ?? getAnimeId(item);
    if (!id) return;
    router.push({
      pathname: "/player",
      params: {
        url: "",
        title: item.animeTitle ?? getAnimeTitle(item),
        image: item.image ?? getAnimeImage(item) ?? "",
        season: String(item.season ?? 1),
        episodeNum: String(item.episode ?? 1),
        animeId: id,
        language: item.language ?? "VOSTFR",
        availableLanguages: item.language ?? "VOSTFR",
      },
    });
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const isInitialLoad = loadingPopular && loadingRecent && loadingReco
    && popularList.length === 0 && recentList.length === 0;

  if (isInitialLoad) {
    return <LoadingScreen label="Atomic Flix" />;
  }

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
          { paddingTop: topPadding + 8, paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 76 },
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
          <View {...panResponder.panHandlers}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
              <HeroBanner
                title={getAnimeTitle(featured)}
                image={getAnimeImage(featured)}
                type={featured.type ?? featured.category}
                onPress={() => handleAnimePress(featured)}
              />
            </Animated.View>
            {featuredList.length > 1 && (
              <View style={styles.dots}>
                {featuredList.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      const dir: 1 | -1 = i > featuredIndex ? 1 : -1;
                      goToIndex(i, dir);
                    }}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: i === featuredIndex ? colors.neonPurple : colors.border,
                        width: i === featuredIndex ? 18 : 6,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {classiquesList.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Classiques" accent />
            <FlatList
              data={classiquesList.slice(0, 15)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.list}
              keyExtractor={(item, i) => `cls-${i}-${getAnimeId(item)}`}
              renderItem={({ item }) => (
                <AnimeCard
                  title={getAnimeTitle(item)}
                  image={getAnimeImage(item)}
                  type={item.type ?? item.category}
                  onPress={() => handleAnimePress(item)}
                />
              )}
            />
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader
            title="✨ Pépites"
            accent
          />
          {loadingPopular ? (
            <FlatList
              data={[1, 2, 3, 4]}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.list}
              keyExtractor={(i) => `skel-pep-${i}`}
              renderItem={() => <SkeletonCard width={140} height={198} />}
            />
          ) : (
            <FlatList
              data={(pepitesList.length > 0 ? pepitesList : popularList).slice(0, 15)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.list}
              keyExtractor={(item, i) => `pep-${i}-${getAnimeId(item)}`}
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
              keyExtractor={(item, i) => `rec-${i}-${getAnimeId(item)}`}
              renderItem={({ item }) => (
                <AnimeCard
                  title={getAnimeTitle(item)}
                  image={getAnimeImage(item)}
                  episode={item.episode ?? item.number}
                  language={item.language}
                  season={item.season}
                  size="small"
                  onPress={() => handleRecentPress(item)}
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
              keyExtractor={(item, i) => `reco-${i}-${getAnimeId(item)}`}
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
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: -16,
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
