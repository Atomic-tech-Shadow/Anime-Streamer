import React, { useState, useRef, useEffect } from "react";
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
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useEpisodeSources, useEpisodes } from "@/hooks/useAnime";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const LANGS = [
  { key: "VOSTFR", label: "VO", flag: null },
  { key: "VF", label: "VF", flag: "🇫🇷" },
  { key: "VF/VOSTFR", label: "VO+VF", flag: null },
];

function getSources(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.sources) return data.sources;
  if (data.embeds) return data.embeds;
  if (data.players) return data.players;
  if (data.url) return [{ url: data.url, embed: data.url, server: "Lecteur" }];
  return [];
}

function getEpisodes(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.episodes) return data.episodes;
  if (data.results) return data.results;
  return [];
}

function PickerModal({
  visible,
  title,
  items,
  selected,
  onSelect,
  onClose,
  colors,
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
          style={{ maxHeight: 320 }}
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
    url: initialUrl,
    title,
    image,
    season,
    episodeNum,
    animeId,
    language: initialLang,
  } = useLocalSearchParams<{
    url: string;
    title: string;
    image: string;
    season: string;
    episodeNum: string;
    animeId: string;
    language: string;
  }>();

  const [selectedLang, setSelectedLang] = useState(initialLang ?? "VOSTFR");
  const [selectedEpisodeUrl, setSelectedEpisodeUrl] = useState(initialUrl ?? "");
  const [selectedEpisodeNum, setSelectedEpisodeNum] = useState(episodeNum ?? "1");
  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [showEpisodePicker, setShowEpisodePicker] = useState(false);
  const [showServerPicker, setShowServerPicker] = useState(false);

  const { data: episodesData } = useEpisodes(animeId ?? "", Number(season ?? 1), selectedLang);
  const episodes = getEpisodes(episodesData);

  // Auto-load episode 1 when arriving from season card (no initial URL)
  useEffect(() => {
    if (!selectedEpisodeUrl && episodes.length > 0) {
      const first = episodes[0];
      const firstUrl = first.url ?? first.link ?? "";
      const firstNum = String(first.number ?? first.episode ?? 1);
      if (firstUrl) {
        setSelectedEpisodeUrl(firstUrl);
        setSelectedEpisodeNum(firstNum);
      }
    }
  }, [episodes]);

  const { data: sourcesData, isLoading: loadingSources } = useEpisodeSources(selectedEpisodeUrl);
  const sources = getSources(sourcesData);

  const selectedSource = sources[selectedServerIdx];
  const embedUrl = selectedSource?.embed ?? selectedSource?.url ?? selectedEpisodeUrl ?? "";

  const lastSelection = `ÉPISODE ${selectedEpisodeNum}`;

  const episodeItems = episodes.map((ep: any) => ({
    label: `Épisode ${ep.number ?? ep.episode ?? "?"}${ep.title ? ` — ${ep.title}` : ""}`,
    value: String(ep.number ?? ep.episode ?? ep.url),
  }));

  const serverItems = sources.map((s: any, i: number) => ({
    label: s.server ?? s.name ?? `Serveur ${i + 1}`,
    value: String(i),
  }));

  const currentServerLabel = sources[selectedServerIdx]?.server ?? sources[selectedServerIdx]?.name ?? "Serveur";
  const currentLangConfig = LANGS.find((l) => l.key === selectedLang) ?? LANGS[0];

  const handleEpisodeSelect = (value: string) => {
    const ep = episodes.find((e: any) => String(e.number ?? e.episode ?? e.url) === value);
    if (ep) {
      const epUrl = ep.url ?? ep.link ?? "";
      setSelectedEpisodeNum(String(ep.number ?? ep.episode ?? "?"));
      setSelectedEpisodeUrl(epUrl);
      setSelectedServerIdx(0);
    }
  };

  const handleOpenExternal = () => {
    if (embedUrl) Linking.openURL(embedUrl).catch(() => {});
  };

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── Hero header ── */}
        <View style={styles.hero}>
          {image ? (
            <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />
          )}
          <LinearGradient
            colors={["rgba(8,8,15,0.15)", "rgba(8,8,15,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: topPadding + 12, backgroundColor: "rgba(0,0,0,0.45)" }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          {/* External link */}
          <TouchableOpacity
            style={[styles.externalBtn, { top: topPadding + 12, backgroundColor: "rgba(0,0,0,0.45)" }]}
            onPress={handleOpenExternal}
            activeOpacity={0.8}
          >
            <Feather name="external-link" size={18} color="#fff" />
          </TouchableOpacity>
          {/* Title */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} numberOfLines={2}>{title ?? "Lecture"}</Text>
            {season ? (
              <Text style={styles.heroSeason}>SAISON {season}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          {/* ── Language buttons ── */}
          <View style={styles.langRow}>
            {LANGS.map((lang) => {
              const isActive = selectedLang === lang.key;
              return (
                <TouchableOpacity
                  key={lang.key}
                  onPress={() => { setSelectedLang(lang.key); setSelectedServerIdx(0); }}
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor: isActive ? colors.neonPurple : colors.card,
                      borderColor: isActive ? colors.neonPurple : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {lang.flag && <Text style={styles.langFlag}>{lang.flag}</Text>}
                  <Text style={[styles.langLabel, { color: isActive ? "#fff" : colors.mutedForeground }]}>
                    {lang.label}
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
                ÉPISODE {selectedEpisodeNum}
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

          {/* ── Last selection label ── */}
          <Text style={[styles.lastSelection, { color: colors.mutedForeground }]}>
            <Text style={{ color: colors.foreground, fontWeight: "800" }}>DERNIÈRE SÉLECTION</Text>
            {" : "}
            {lastSelection}
          </Text>

          {/* ── Player ── */}
          {loadingSources ? (
            <View style={[styles.playerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="loader" size={28} color={colors.mutedForeground} />
              <Text style={[styles.playerMsg, { color: colors.mutedForeground }]}>Chargement du lecteur…</Text>
            </View>
          ) : !embedUrl ? (
            <View style={[styles.playerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={28} color={colors.mutedForeground} />
              <Text style={[styles.playerMsg, { color: colors.mutedForeground }]}>Source indisponible</Text>
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

      {/* Episode picker modal */}
      <PickerModal
        visible={showEpisodePicker}
        title="Choisir un épisode"
        items={episodeItems}
        selected={selectedEpisodeNum}
        onSelect={handleEpisodeSelect}
        onClose={() => setShowEpisodePicker(false)}
        colors={colors}
      />

      {/* Server picker modal */}
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
  hero: {
    height: 220,
    position: "relative",
    justifyContent: "flex-end",
  },
  backBtn: {
    position: "absolute",
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  externalBtn: {
    position: "absolute",
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSeason: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  langRow: {
    flexDirection: "row",
    gap: 10,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  langFlag: {
    fontSize: 20,
  },
  langLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  dropdownRow: {
    flexDirection: "row",
    gap: 10,
  },
  dropdown: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  dropdownText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
  },
  lastSelection: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  playerBox: {
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  playerMsg: {
    fontSize: 14,
    textAlign: "center",
  },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 7,
    marginTop: 4,
  },
  openBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  webviewContainer: {
    height: 230,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  webview: { flex: 1 },
  webviewLoader: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
});
