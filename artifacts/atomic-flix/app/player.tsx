import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  ScrollView,
  Image,
  Modal,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useEpisodes, useSeasons } from "@/hooks/useAnime";

// Human-readable label for each language key
const LANG_LABEL: Record<string, string> = {
  VOSTFR: "VOSTFR",
  VF:     "VF",
  VF2:    "VF 2",
};

function getEpisodeList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.episodes) return data.episodes;
  return [];
}

function getStreamingSources(episode: any): any[] {
  if (!episode) return [];
  if (Array.isArray(episode.streamingSources)) return episode.streamingSources;
  if (Array.isArray(episode.sources)) return episode.sources;
  return [];
}

function getSeasonList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.seasons) return data.seasons;
  return [];
}

function PickerModal({
  visible, title, items, selected, onSelect, onClose, colors,
}: {
  visible: boolean;
  title: string;
  items: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  colors: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.modalHandle} />
        <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
        <FlatList
          data={items}
          keyExtractor={(i) => i.value}
          style={{ maxHeight: 340 }}
          renderItem={({ item }) => {
            const isSelected = item.value === selected;
            return (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  {
                    backgroundColor: isSelected ? colors.neonPurple + "22" : "transparent",
                    borderColor: isSelected ? colors.neonPurple : "transparent",
                  },
                ]}
                onPress={() => { onSelect(item.value); onClose(); }}
              >
                <Text style={[styles.modalItemText, { color: isSelected ? colors.neonPurple : colors.foreground }]}>
                  {item.label}
                </Text>
                {isSelected && <Feather name="check" size={16} color={colors.neonPurple} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

export default function PlayerScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    title,
    image,
    season,
    episodeNum,
    animeId,
    language: initialLang,
    availableLanguages: availableLangsParam,
  } = useLocalSearchParams<{
    url: string;
    title: string;
    image: string;
    season: string;
    episodeNum: string;
    animeId: string;
    language: string;
    availableLanguages: string;
  }>();

  // Parse languages passed from the detail screen (e.g. "VOSTFR,VF")
  const passedLangs: string[] = availableLangsParam
    ? availableLangsParam.split(",").filter(Boolean)
    : [];

  const [selectedLang, setSelectedLang]           = useState(initialLang ?? "VOSTFR");
  const [selectedEpNum, setSelectedEpNum]         = useState(episodeNum ?? "1");
  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [showEpisodePicker, setShowEpisodePicker] = useState(false);
  const [showServerPicker, setShowServerPicker]   = useState(false);

  // Fetch seasons to get the authoritative language list for this season
  const { data: seasonsData } = useSeasons(animeId ?? "");
  const allSeasons = getSeasonList(seasonsData);
  const currentSeasonData = allSeasons.find((s: any) => String(s.number) === String(season ?? "1"));

  // Priority: season API > param passed from detail > fallback ["VOSTFR"]
  const availableLangs: string[] =
    (currentSeasonData?.languages?.length > 0 ? currentSeasonData.languages : null) ??
    (passedLangs.length > 0 ? passedLangs : null) ??
    ["VOSTFR"];

  // If the selected language is not in the available list, switch to the first one
  useEffect(() => {
    if (availableLangs.length > 0 && !availableLangs.includes(selectedLang)) {
      setSelectedLang(availableLangs[0]);
      setSelectedServerIdx(0);
    }
  }, [availableLangs.join(",")]);

  // Reset server index when language changes
  const handleLangChange = (lang: string) => {
    setSelectedLang(lang);
    setSelectedServerIdx(0);
  };

  // Fetch episodes (each episode already carries streamingSources)
  const { data: episodesData, isLoading: loadingEpisodes } = useEpisodes(
    animeId ?? "",
    Number(season ?? 1),
    selectedLang
  );
  const episodes = getEpisodeList(episodesData);

  // Find the current episode object
  const currentEpisode =
    episodes.find((e: any) => String(e.number ?? e.episode) === selectedEpNum) ??
    episodes[0];

  // Streaming sources embedded in the episode
  const sources = getStreamingSources(currentEpisode);

  // Embed URL for the selected server
  const embedUrl = sources[selectedServerIdx]?.url ?? "";
  const currentServerLabel =
    sources[selectedServerIdx]?.server ?? `Serveur ${selectedServerIdx + 1}`;

  const handleOpenExternal = () => {
    if (embedUrl) Linking.openURL(embedUrl).catch(() => {});
  };

  const episodeItems = episodes.map((ep: any) => ({
    label: `Épisode ${ep.number ?? ep.episode ?? "?"}`,
    value: String(ep.number ?? ep.episode ?? "?"),
  }));

  const serverItems = sources.map((s: any, i: number) => ({
    label: `${s.server ?? `Serveur ${i + 1}`}${s.quality ? ` · ${s.quality}` : ""}`,
    value: String(i),
  }));

  const topPadding = Platform.OS === "web" ? 0 : insets.top;
  const isLoading  = loadingEpisodes && episodes.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          {image ? (
            <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />
          )}
          <LinearGradient
            colors={["rgba(8,8,15,0.15)", "rgba(8,8,15,0.88)"]}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: topPadding + 12, backgroundColor: "rgba(0,0,0,0.45)" }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.externalBtn, { top: topPadding + 12, backgroundColor: "rgba(0,0,0,0.45)" }]}
            onPress={handleOpenExternal}
            activeOpacity={0.8}
          >
            <Feather name="external-link" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} numberOfLines={2}>{title ?? "Lecture"}</Text>
            {season ? <Text style={styles.heroSeason}>SAISON {season}</Text> : null}
          </View>
        </View>

        <View style={styles.body}>

          {/* ── Language buttons (dynamic from API) ── */}
          <View style={styles.langRow}>
            {availableLangs.map((lang) => {
              const isActive = selectedLang === lang;
              const label    = LANG_LABEL[lang] ?? lang;
              const isVF     = lang.startsWith("VF");
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => handleLangChange(lang)}
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor: isActive ? colors.neonPurple : colors.card,
                      borderColor:     isActive ? colors.neonPurple : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {isVF && <Text style={styles.langFlag}>🇫🇷</Text>}
                  <Text style={[styles.langLabel, { color: isActive ? "#fff" : colors.mutedForeground }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Episode + Server dropdowns ── */}
          <View style={styles.dropdownRow}>
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.neonPurple }]}
              onPress={() => episodeItems.length > 0 && setShowEpisodePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownText, { color: colors.foreground }]} numberOfLines={1}>
                ÉPISODE {selectedEpNum}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.neonPurple} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.neonPurple }]}
              onPress={() => serverItems.length > 0 && setShowServerPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownText, { color: colors.foreground }]} numberOfLines={1}>
                {currentServerLabel.toUpperCase()}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.neonPurple} />
            </TouchableOpacity>
          </View>

          {/* ── Last selection ── */}
          <Text style={[styles.lastSelection, { color: colors.mutedForeground }]}>
            <Text style={{ color: colors.foreground, fontWeight: "800" }}>DERNIÈRE SÉLECTION</Text>
            {" : ÉPISODE "}{selectedEpNum}
          </Text>

          {/* ── Player ── */}
          {isLoading ? (
            <View style={[styles.playerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="loader" size={28} color={colors.mutedForeground} />
              <Text style={[styles.playerMsg, { color: colors.mutedForeground }]}>
                Chargement des épisodes…
              </Text>
            </View>
          ) : !embedUrl ? (
            <View style={[styles.playerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={28} color={colors.mutedForeground} />
              <Text style={[styles.playerMsg, { color: colors.mutedForeground }]}>
                {sources.length === 0
                  ? "Aucune source disponible pour cet épisode"
                  : "Sélectionne un serveur"}
              </Text>
            </View>
          ) : Platform.OS === "web" ? (
            <View style={[styles.playerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="play-circle" size={36} color={colors.neonPurple} />
              <Text style={[styles.playerMsg, { color: colors.foreground }]}>Lancer dans un onglet</Text>
              <TouchableOpacity
                style={[styles.openBtn, { backgroundColor: colors.neonPurple }]}
                onPress={handleOpenExternal}
                activeOpacity={0.8}
              >
                <Feather name="external-link" size={15} color="#fff" />
                <Text style={styles.openBtnText}>Ouvrir le lecteur</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.webviewContainer, { borderColor: colors.border }]}>
              <WebView
                key={embedUrl}
                source={{ uri: embedUrl }}
                style={styles.webview}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={[StyleSheet.absoluteFill, styles.webviewLoader, { backgroundColor: colors.card }]}>
                    <Text style={[styles.playerMsg, { color: colors.mutedForeground }]}>Chargement…</Text>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Episode picker */}
      <PickerModal
        visible={showEpisodePicker}
        title="Choisir un épisode"
        items={episodeItems}
        selected={selectedEpNum}
        onSelect={(v) => { setSelectedEpNum(v); setSelectedServerIdx(0); }}
        onClose={() => setShowEpisodePicker(false)}
        colors={colors}
      />

      {/* Server picker */}
      <PickerModal
        visible={showServerPicker}
        title="Choisir un serveur"
        items={serverItems}
        selected={String(selectedServerIdx)}
        onSelect={(v) => setSelectedServerIdx(Number(v))}
        onClose={() => setShowServerPicker(false)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { height: 220, justifyContent: "flex-end", position: "relative" },
  backBtn: { position: "absolute", left: 14, width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  externalBtn: { position: "absolute", right: 14, width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  heroContent: { paddingHorizontal: 16, paddingBottom: 16 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.5, textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroSeason: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" as const, letterSpacing: 1.5, marginTop: 4 },
  body: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  langBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  langFlag: { fontSize: 18 },
  langLabel: { fontSize: 13, fontWeight: "700" as const, letterSpacing: 0.5 },
  dropdownRow: { flexDirection: "row", gap: 10 },
  dropdown: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, gap: 6 },
  dropdownText: { flex: 1, fontSize: 12, fontWeight: "700" as const, letterSpacing: 0.8 },
  lastSelection: { fontSize: 12, letterSpacing: 0.3 },
  playerBox: { height: 220, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  playerMsg: { fontSize: 14, textAlign: "center", paddingHorizontal: 20 },
  openBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, gap: 7, marginTop: 4 },
  openBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" as const },
  webviewContainer: { height: 230, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  webview: { flex: 1 },
  webviewLoader: { alignItems: "center", justifyContent: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingTop: 12, paddingBottom: 32, paddingHorizontal: 16 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 15, fontWeight: "700" as const, marginBottom: 12 },
  modalItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  modalItemText: { fontSize: 14, fontWeight: "500" as const },
});
