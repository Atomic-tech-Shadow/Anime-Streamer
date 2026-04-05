import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useHistory, HistoryEntry } from "@/hooks/useHistory";
import NeonGlow from "@/components/NeonGlow";
import LoadingScreen from "@/components/LoadingScreen";

const FLAG_BASE = "https://raw.githubusercontent.com/Anime-Sama/IMG/img/autres";
const LANG_FLAG: Record<string, string> = {
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

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return new Date(ts).toLocaleDateString("fr-FR");
}

function HistoryCard({
  item,
  index,
  colors,
  onPress,
  onDelete,
}: {
  item: HistoryEntry;
  index: number;
  colors: any;
  onPress: () => void;
  onDelete: () => void;
}) {
  const slideX  = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 40, 300),
        useNativeDriver: true,
      }),
      Animated.spring(slideX, {
        toValue: 0,
        delay: Math.min(index * 40, 300),
        useNativeDriver: true,
        tension: 120,
        friction: 10,
      }),
    ]).start();
  }, []);

  const rawSeason = item.season ? String(item.season) : null;
  const seasonLabel = rawSeason
    ? rawSeason.toLowerCase().startsWith("s") ? rawSeason : `S${rawSeason}`
    : null;
  const flagUrl = LANG_FLAG[item.language?.toUpperCase?.() ?? ""];

  return (
    <Animated.View style={{ opacity, transform: [{ translateX: slideX }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.78}
        onPress={onPress}
      >
        <View style={[styles.thumb, { backgroundColor: colors.secondary }]}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : null}
          <LinearGradient
            colors={["transparent", "rgba(8,8,15,0.6)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.playBadge, { backgroundColor: colors.neonPurple + "CC" }]}>
            <Feather name="play" size={10} color="#fff" />
          </View>
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            {seasonLabel && (
              <View style={[styles.badge, { backgroundColor: colors.neonPurple + "28", borderColor: colors.neonPurple + "44" }]}>
                <Feather name="layers" size={9} color={colors.neonPurple} />
                <Text style={[styles.badgeText, { color: colors.neonPurple }]}>{seasonLabel}</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: colors.neonBlue + "28", borderColor: colors.neonBlue + "44" }]}>
              <Feather name="tv" size={9} color={colors.neonBlue} />
              <Text style={[styles.badgeText, { color: colors.neonBlue }]}>Ép. {item.episodeNum}</Text>
            </View>
            {flagUrl && (
              <Image source={{ uri: flagUrl }} style={styles.flag} contentFit="cover" cachePolicy="memory-disk" />
            )}
          </View>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(item.watchedAt)}
          </Text>
        </View>

        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="x" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, loaded, removeFromHistory, clearHistory } = useHistory();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (!loaded) {
    return <LoadingScreen label="Historique" />;
  }

  const handleResume = (item: HistoryEntry) => {
    router.push({
      pathname: "/player",
      params: {
        url: "",
        title: item.title,
        image: item.image,
        season: item.season,
        seasonLabel: item.seasonLabel ?? "",
        seasonName: item.seasonName ?? "",
        seasonType: item.seasonType ?? "",
        episodeNum: item.episodeNum,
        animeId: item.animeId,
        language: item.language,
        availableLanguages: item.availableLanguages,
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NeonGlow color={colors.neonPurple} size={260} style={{ top: -50, left: -70 }} />
      <NeonGlow color={colors.neonBlue}   size={180} style={{ top: 140, right: -50 }} />

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingTop: topPadding + 8, paddingBottom: Platform.OS === "web" ? 110 : insets.bottom + 90 },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerAccent, { backgroundColor: colors.neonPurple }]} />
              <View>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Historique</Text>
                <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
                  {history.length} épisode{history.length !== 1 ? "s" : ""} regardé{history.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            {history.length > 0 && (
              <TouchableOpacity
                onPress={clearHistory}
                style={[styles.clearBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <Feather name="trash-2" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="clock" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun historique</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Les épisodes regardés apparaîtront ici
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <HistoryCard
            item={item}
            index={index}
            colors={colors}
            onPress={() => handleResume(item)}
            onDelete={() => removeFromHistory(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flexGrow: 1, paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerAccent: { width: 4, height: 40, borderRadius: 4 },
  pageTitle: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, marginTop: 1, fontWeight: "500" as const },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    padding: 4,
  },
  thumb: {
    width: 72,
    height: 96,
    borderRadius: 10,
    overflow: "hidden",
  },
  playBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 5,
  },
  title: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "700" as const },
  flag: { width: 24, height: 16, borderRadius: 3 },
  time: { fontSize: 11, fontWeight: "500" as const },
  deleteBtn: {
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    paddingTop: 10,
  },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 14 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
});
