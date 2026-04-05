import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { usePlanning } from "@/hooks/useAnime";
import NeonGlow from "@/components/NeonGlow";
import LoadingScreen from "@/components/LoadingScreen";

const { width: SCREEN_W } = Dimensions.get("window");

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

const ALL_DAYS = [
  { key: "today",    label: "Auj.",   full: "Aujourd'hui" },
  { key: "lundi",    label: "Lun",    full: "Lundi" },
  { key: "mardi",    label: "Mar",    full: "Mardi" },
  { key: "mercredi", label: "Mer",    full: "Mercredi" },
  { key: "jeudi",    label: "Jeu",    full: "Jeudi" },
  { key: "vendredi", label: "Ven",    full: "Vendredi" },
  { key: "samedi",   label: "Sam",    full: "Samedi" },
  { key: "dimanche", label: "Dim",    full: "Dimanche" },
];

function getPlanningList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.items) return data.items;
  if (data.planning) return data.planning;
  if (data.results) return data.results;
  if (data.data) return Array.isArray(data.data) ? data.data : [];
  return [];
}


function getAnimeImage(item: any): string | undefined {
  return item?.image ?? item?.cover ?? item?.thumbnail ?? item?.anime?.image;
}

function getAnimeId(item: any): string {
  return item?.animeId ?? item?.id ?? item?.anime?.id ?? item?.url ?? item?.title ?? "";
}

function getAnimeTitle(item: any): string {
  return item?.title ?? item?.animeTitle ?? item?.anime?.title ?? "";
}

function DayPill({
  day, isActive, onPress, colors,
}: {
  day: typeof ALL_DAYS[0];
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) {
  const scale   = useRef(new Animated.Value(1)).current;
  const glowOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1.08 : 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
      Animated.timing(glowOp, {
        toValue: isActive ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Glow behind */}
        <Animated.View
          style={[
            styles.pillGlow,
            {
              backgroundColor: colors.neonPurple,
              opacity: glowOp,
              shadowColor: colors.neonPurple,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 14,
            },
          ]}
        />
        {isActive ? (
          <LinearGradient
            colors={[colors.neonPurple, colors.neonBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.pill, styles.pillActive]}
          >
            <Text style={styles.pillTextActive}>{day.label}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{day.label}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function PlanningRow({ item, index, colors, onPress }: {
  item: any; index: number; colors: any; onPress: () => void;
}) {
  const slideX  = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.spring(slideX, {
        toValue: 0,
        delay: index * 55,
        useNativeDriver: true,
        tension: 120,
        friction: 10,
      }),
    ]).start();
  }, []);

  const title       = getAnimeTitle(item) || "Anime inconnu";
  const img         = getAnimeImage(item);
  const time        = item.releaseTime ?? item.time ?? item.hour ?? item.schedule;
  const seasonLabel = item.season ? `S${item.season}` : null;
  const langLabel   = item.language ?? null;

  return (
    <Animated.View style={{ opacity, transform: [{ translateX: slideX }] }}>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.78}
        onPress={onPress}
      >
        {/* Thumbnail */}
        <View style={[styles.thumb, { backgroundColor: colors.secondary }]}>
          {img ? (
            <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
          ) : null}
          <LinearGradient
            colors={["transparent", "rgba(8,8,15,0.55)"]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.badgeRow}>
            {seasonLabel && (
              <View style={[styles.badge, { backgroundColor: colors.neonPurple + "28", borderColor: colors.neonPurple + "44" }]}>
                <Feather name="layers" size={9} color={colors.neonPurple} />
                <Text style={[styles.badgeText, { color: colors.neonPurple }]}>{seasonLabel}</Text>
              </View>
            )}
            {langLabel && LANG_FLAG_URL[langLabel.toUpperCase()] && (
              <Image
                source={{ uri: LANG_FLAG_URL[langLabel.toUpperCase()] }}
                style={styles.flag}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            )}
          </View>
          {time && (
            <View style={styles.timeRow}>
              <Feather name="clock" size={11} color={colors.neonBlue} />
              <Text style={[styles.timeText, { color: colors.neonBlue }]}>{time}</Text>
            </View>
          )}
        </View>

        <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginRight: 4 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PlanningScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState("today");

  const { data, isLoading } = usePlanning(selectedDay);
  const planningList = getPlanningList(data);

  const selectedDayObj = ALL_DAYS.find((d) => d.key === selectedDay) ?? ALL_DAYS[0];

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NeonGlow color={colors.neonBlue}   size={280} style={{ top: -60, right: -80 }} />
      <NeonGlow color={colors.neonPurple} size={180} style={{ top: 120, left: -60 }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPadding + 8, paddingBottom: Platform.OS === "web" ? 110 : insets.bottom + 90 },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerAccent, { backgroundColor: colors.neonBlue }]} />
            <View>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Planning</Text>
              <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
                {selectedDayObj.full}
              </Text>
            </View>
          </View>
          <View style={[styles.calIcon, { backgroundColor: colors.neonBlue + "1A", borderColor: colors.neonBlue + "44" }]}>
            <Feather name="calendar" size={18} color={colors.neonBlue} />
          </View>
        </View>

        {/* ── Day Selector ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayList}
          style={styles.dayScroll}
        >
          {ALL_DAYS.map((d) => (
            <DayPill
              key={d.key}
              day={d}
              isActive={selectedDay === d.key}
              onPress={() => setSelectedDay(d.key)}
              colors={colors}
            />
          ))}
        </ScrollView>

        {/* ── Content ── */}
        {isLoading ? (
          <LoadingScreen label="Planning" fullscreen={false} style={{ flex: 1, minHeight: 200 }} />
        ) : planningList.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="moon" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune sortie</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Rien de prévu ce jour</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {planningList.map((item, i) => {
              const id = getAnimeId(item);
              return (
                <PlanningRow
                  key={id || String(i)}
                  item={item}
                  index={i}
                  colors={colors}
                  onPress={() => {
                    if (id) router.push({
                      pathname: "/anime/[id]",
                      params: { id, title: getAnimeTitle(item), image: getAnimeImage(item) ?? "" },
                    });
                  }}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerAccent: {
    width: 4,
    height: 40,
    borderRadius: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 1,
    fontWeight: "500" as const,
  },
  calIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  dayScroll: { marginBottom: 24 },
  dayList: { paddingHorizontal: 16, gap: 8, alignItems: "center" },

  pillGlow: {
    position: "absolute",
    inset: -2,
    borderRadius: 22,
    opacity: 0,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
  },
  pillActive: { borderWidth: 0 },
  pillText: { fontSize: 13, fontWeight: "600" as const },
  pillTextActive: { fontSize: 13, fontWeight: "700" as const, color: "#fff" },

  list: { paddingHorizontal: 16, gap: 10 },

  row: {
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
  info: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 5,
  },
  rowTitle: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
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
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 11, fontWeight: "600" as const },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: 70, gap: 14 },
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
  emptyText: { fontSize: 14, textAlign: "center" },
});
