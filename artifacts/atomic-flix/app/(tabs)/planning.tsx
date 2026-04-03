import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";

import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { usePlanning } from "@/hooks/useAnime";
import NeonGlow from "@/components/NeonGlow";
import LoadingScreen from "@/components/LoadingScreen";

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

const DAYS = [
  { key: "lundi",    label: "Lun" },
  { key: "mardi",    label: "Mar" },
  { key: "mercredi", label: "Mer" },
  { key: "jeudi",    label: "Jeu" },
  { key: "vendredi", label: "Ven" },
  { key: "samedi",   label: "Sam" },
  { key: "dimanche", label: "Dim" },
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

export default function PlanningScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState("today");

  const { data, isLoading } = usePlanning(selectedDay);
  const planningList = getPlanningList(data);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NeonGlow
        color={colors.neonBlue}
        size={250}
        style={{ top: -40, right: -80 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: topPadding + 8,
            paddingBottom: Platform.OS === "web" ? 110 : insets.bottom + 90,
          },
        ]}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Planning
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          Sorties de la semaine
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayList}
          style={styles.dayScroll}
        >
          <TouchableOpacity
            onPress={() => setSelectedDay("today")}
            style={[
              styles.dayBtn,
              {
                backgroundColor:
                  selectedDay === "today" ? colors.neonPurple : colors.card,
                borderColor:
                  selectedDay === "today" ? colors.neonPurple : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.dayBtnText,
                {
                  color:
                    selectedDay === "today" ? "#fff" : colors.mutedForeground,
                },
              ]}
            >
              Aujourd'hui
            </Text>
          </TouchableOpacity>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d.key}
              onPress={() => setSelectedDay(d.key)}
              style={[
                styles.dayBtn,
                {
                  backgroundColor:
                    selectedDay === d.key ? colors.neonPurple : colors.card,
                  borderColor:
                    selectedDay === d.key ? colors.neonPurple : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayBtnText,
                  {
                    color:
                      selectedDay === d.key ? "#fff" : colors.mutedForeground,
                  },
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <LoadingScreen label="Planning" fullscreen={false} style={{ flex: 1, minHeight: 200 }} />
        ) : planningList.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Aucune sortie
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Aucun anime prévu ce jour
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {planningList.map((item, i) => {
              const id = getAnimeId(item);
              const title = getAnimeTitle(item) || "Anime inconnu";
              const img = getAnimeImage(item);
              const time = item.releaseTime ?? item.time ?? item.hour ?? item.schedule;
              const seasonLabel = item.season ? `S${item.season}` : null;
              const langLabel = item.language ?? null;

              return (
                <TouchableOpacity
                  key={id || String(i)}
                  style={[
                    styles.planningItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    if (id) {
                      router.push({
                        pathname: "/anime/[id]",
                        params: {
                          id,
                          title,
                          image: img ?? "",
                        },
                      });
                    }
                  }}
                >
                  <View
                    style={[
                      styles.planningImage,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    {img ? (
                      <Image
                        source={{ uri: img }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                  <View style={styles.planningInfo}>
                    <Text
                      style={[styles.planningTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {title}
                    </Text>
                    {(seasonLabel || langLabel) && (
                      <View style={styles.row}>
                        {seasonLabel && (
                          <View
                            style={[
                              styles.epBadge,
                              { backgroundColor: colors.neonPurple + "33" },
                            ]}
                          >
                            <Text style={[styles.epText, { color: colors.neonPurple }]}>
                              {seasonLabel}
                            </Text>
                          </View>
                        )}
                        {langLabel && LANG_FLAG_URL[langLabel.toUpperCase()] && (
                          <Image
                            source={{ uri: LANG_FLAG_URL[langLabel.toUpperCase()] }}
                            style={styles.langFlag}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    )}
                    {time && (
                      <View style={styles.timeRow}>
                        <Feather
                          name="clock"
                          size={12}
                          color={colors.mutedForeground}
                        />
                        <Text
                          style={[
                            styles.timeText,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {time}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
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
  pageTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    paddingHorizontal: 16,
  },
  pageSubtitle: {
    fontSize: 14,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  dayScroll: { marginBottom: 24 },
  dayList: { paddingHorizontal: 16, gap: 8 },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayBtnText: { fontSize: 13, fontWeight: "600" as const },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const },
  emptyText: { fontSize: 14, textAlign: "center" },
  list: { paddingHorizontal: 16, gap: 10 },
  planningItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 4,
  },
  planningImage: {
    width: 70,
    height: 90,
    borderRadius: 9,
    overflow: "hidden",
  },
  planningInfo: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  planningTitle: { fontSize: 14, fontWeight: "600" as const, lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center" },
  epBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  epText: { fontSize: 11, fontWeight: "700" as const },
  langFlag: { width: 26, height: 18, borderRadius: 3 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 12 },
});
