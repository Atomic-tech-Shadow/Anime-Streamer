import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
  FlatList,
  Dimensions,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useScanChapters } from "@/hooks/useAnime";
import SpinnerLoader from "@/components/SpinnerLoader";

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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ChapterMeta {
  number: number;
  title?: string;
  pageCount?: number;
}

function ChapterRow({
  chapter,
  onPress,
  colors,
}: {
  chapter: ChapterMeta;
  onPress: () => void;
  colors: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
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
      <Animated.View
        style={[
          styles.chapterRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={[styles.chapterNumBadge, { backgroundColor: colors.neonPurple + "1F", borderColor: colors.neonPurple + "55" }]}>
          <Text style={[styles.chapterNumText, { color: colors.neonPurple }]}>{chapter.number}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.chapterTitle, { color: colors.foreground }]} numberOfLines={1}>
            {chapter.title?.trim() ? chapter.title : `Chapitre ${chapter.number}`}
          </Text>
          {chapter.pageCount ? (
            <View style={styles.chapterMetaRow}>
              <Feather name="book-open" size={11} color={colors.mutedForeground} />
              <Text style={[styles.chapterMetaText, { color: colors.mutedForeground }]}>
                {chapter.pageCount} page{chapter.pageCount > 1 ? "s" : ""}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.chapterChevron, { backgroundColor: colors.neonPurple + "14" }]}>
          <Feather name="chevron-right" size={16} color={colors.neonPurple} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function LanguagePicker({
  visible, options, selected, onSelect, onClose, colors,
}: {
  visible: boolean;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  colors: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.modalTitle, { color: colors.foreground }]}>Langue</Text>
        <FlatList
          data={options}
          keyExtractor={(i) => i}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = item === selected;
            return (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  isSelected && { backgroundColor: colors.neonPurple + "1A" },
                ]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.75}
              >
                {LANG_FLAG_URL[item] ? (
                  <Image
                    source={{ uri: LANG_FLAG_URL[item] }}
                    style={{ width: 24, height: 16, borderRadius: 3, marginRight: 12 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : null}
                <Text style={[
                  styles.modalItemText,
                  { color: isSelected ? colors.neonPurple : colors.foreground },
                  isSelected && { fontWeight: "700" as const },
                ]}>
                  {item}
                </Text>
                {isSelected && (
                  <View style={[styles.modalCheck, { backgroundColor: colors.neonPurple + "22", borderColor: colors.neonPurple }]}>
                    <Feather name="check" size={11} color={colors.neonPurple} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

export default function ScanChaptersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    id,
    season,
    language: langParam,
    availableLanguages,
    title: paramTitle,
    image: paramImage,
  } = useLocalSearchParams<{
    id: string;
    season: string;
    language: string;
    availableLanguages: string;
    title: string;
    image: string;
  }>();

  const langs = useMemo(
    () => (availableLanguages ? availableLanguages.split(",").filter(Boolean) : ["VF"]),
    [availableLanguages]
  );

  const [language, setLanguage] = useState(langParam ?? langs[0] ?? "VF");
  const [search, setSearch]     = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const seasonValue = season ?? "scan";
  const { data, isLoading, isError, refetch, isFetching } = useScanChapters(
    id ?? "",
    language,
    seasonValue,
  );

  const realName  = data?.realName ?? paramTitle ?? "Scan";
  const chapters  = data?.chapters ?? [];
  const total     = data?.count ?? chapters.length;

  const filteredChapters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter((c) => {
      if (String(c.number).includes(q)) return true;
      if (c.title?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [chapters, search]);

  const openChapter = (chapterNumber: number) => {
    router.push({
      pathname: "/scan/reader",
      params: {
        id: id ?? "",
        season: seasonValue,
        language,
        availableLanguages: langs.join(","),
        chapter: String(chapterNumber),
        title: realName,
        image: paramImage ?? "",
        total: String(total),
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header banner ─────────────────────────────────────────────── */}
      <View style={[styles.heroBanner, { paddingTop: insets.top + 8 }]}>
        {paramImage ? (
          <Image
            source={{ uri: paramImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            blurRadius={Platform.OS === "ios" ? 25 : 8}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
        )}
        <LinearGradient
          colors={["rgba(8,8,15,0.55)", "rgba(8,8,15,0.85)", colors.background]}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
            style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.12)" }]}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.scanBadge, { backgroundColor: colors.neonPurple + "28", borderColor: colors.neonPurple + "55" }]}>
            <Feather name="book-open" size={11} color={colors.neonPurple} />
            <Text style={[styles.scanBadgeText, { color: colors.neonPurple }]}>SCAN</Text>
          </View>
        </View>

        <View style={styles.heroBody}>
          <Text style={styles.heroTitle} numberOfLines={2}>{realName}</Text>
          <View style={styles.heroMetaRow}>
            <View style={[styles.metaChip, { backgroundColor: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.18)" }]}>
              <Feather name="layers" size={10} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaChipText}>{total} chapitres</Text>
            </View>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setShowLangPicker(true); }}
              activeOpacity={0.8}
              style={[styles.langChip, { backgroundColor: colors.neonBlue + "22", borderColor: colors.neonBlue + "55" }]}
            >
              {LANG_FLAG_URL[language] ? (
                <Image
                  source={{ uri: LANG_FLAG_URL[language] }}
                  style={{ width: 18, height: 12, borderRadius: 2 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : null}
              <Text style={[styles.langChipText, { color: colors.neonBlue }]}>{language}</Text>
              {langs.length > 1 ? (
                <Feather name="chevron-down" size={12} color={colors.neonBlue} />
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un chapitre…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            keyboardType="default"
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
              <Feather name="x-circle" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── List ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={{ flex: 1 }}>
          <SpinnerLoader fullscreen />
        </View>
      ) : isError ? (
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.destructive + "1A", borderColor: colors.destructive + "44" }]}>
            <Feather name="alert-triangle" size={22} color={colors.destructive} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Impossible de charger les chapitres</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.neonPurple }]}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={14} color="#fff" />
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : filteredChapters.length === 0 ? (
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.neonPurple + "1A", borderColor: colors.neonPurple + "44" }]}>
            <Feather name="inbox" size={22} color={colors.neonPurple} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            {search ? "Aucun chapitre trouvé" : "Aucun chapitre disponible"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChapters}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <ChapterRow chapter={item} colors={colors} onPress={() => openChapter(item.number)} />
          )}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={() => refetch()}
        />
      )}

      <LanguagePicker
        visible={showLangPicker}
        options={langs}
        selected={language}
        onSelect={setLanguage}
        onClose={() => setShowLangPicker(false)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  heroBanner: {
    height: 220,
    position: "relative",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  scanBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1,
  },
  scanBadgeText: { fontSize: 10, fontWeight: "800" as const, letterSpacing: 0.8 },

  heroBody: { paddingHorizontal: 18, paddingBottom: 18 },
  heroTitle: {
    color: "#fff", fontSize: 24, fontWeight: "800" as const,
    letterSpacing: -0.5, lineHeight: 30, marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  heroMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1,
  },
  metaChipText: { color: "#fff", fontSize: 11, fontWeight: "700" as const, letterSpacing: 0.3 },
  langChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1,
  },
  langChipText: { fontSize: 11, fontWeight: "800" as const, letterSpacing: 0.6 },

  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 10 : 6,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 4 },

  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  chapterRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  chapterNumBadge: {
    minWidth: 44, height: 44, paddingHorizontal: 8,
    borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  chapterNumText: { fontSize: 15, fontWeight: "800" as const, letterSpacing: 0.3 },
  chapterTitle: { fontSize: 14, fontWeight: "700" as const },
  chapterMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  chapterMetaText: { fontSize: 11, fontWeight: "500" as const },
  chapterChevron: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },

  errorState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  errorIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  errorTitle: { fontSize: 15, fontWeight: "700" as const, textAlign: "center" },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  retryBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" as const, letterSpacing: 0.3 },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  modalSheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    maxHeight: "70%",
  },
  modalHandle: { width: 44, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: "800" as const, marginBottom: 10, paddingHorizontal: 4 },
  modalItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 4,
  },
  modalItemText: { flex: 1, fontSize: 14, fontWeight: "500" as const },
  modalItemAccent: { width: 3, height: 16, borderRadius: 2, marginRight: 8 },
  modalCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
});
