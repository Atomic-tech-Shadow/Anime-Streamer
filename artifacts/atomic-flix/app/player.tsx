import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  ScrollView,
  Modal,
  FlatList,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useSeasonEpisodes } from "@/hooks/useAnime";

const FLAG_BASE = "https://raw.githubusercontent.com/Anime-Sama/IMG/img/autres";

// ── Couche 1 : Domaines vidéo autorisés (basés sur l'API réelle) ─────────────
const ALLOWED_DOMAINS = [
  // ── Serveurs de streaming confirmés par l'API anime-sama ──────────────────
  "video.sibnet.ru", "sibnet.ru", "cdn.sibnet.ru", "userdata.sibnet.ru",
  "vidmoly.to", "cdn.vidmoly.to",
  "sendvid.com",
  "smoothpre.com",
  "oneupload.to",
  "myvi.top", "www.myvi.top",
  "vidmoly.net",
  "embed4me.com", "lpayer.embed4me.com",
  "vk.com", "vkvideo.ru",

  // ── Sources anime-sama ────────────────────────────────────────────────────
  "anime-sama.fr", "anime-sama.eu", "anime-sama.to",

  // ── CDNs utilisés par les players vidéo ──────────────────────────────────
  "cloudflare.com", "cdnjs.cloudflare.com",
  "cdn.statically.io", "gcdn.me",
  "jwplatform.com", "jwpcdn.com", "jwpsrv.com",
  "cdn.jsdelivr.net",
  "fonts.googleapis.com", "fonts.gstatic.com",

  // ── Anti-bot / captchas ───────────────────────────────────────────────────
  "hcaptcha.com", "recaptcha.net", "google.com", "gstatic.com",
];

const BLOCKED_SCHEMES = ["tel:", "mailto:", "sms:", "market://", "intent://", "android-app://", "itms://", "itms-apps://"];

function isDomainAllowed(url: string, currentUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol;
    if (BLOCKED_SCHEMES.some((s) => url.startsWith(s))) return false;
    if (!["http:", "https:", "about:", "blob:"].includes(scheme)) return false;
    if (url === "about:blank" || url.startsWith("blob:")) return true;
    const host = parsed.hostname.replace(/^www\./, "");
    if (ALLOWED_DOMAINS.some((d) => host === d || host.endsWith("." + d))) return true;
    try {
      const currentHost = new URL(currentUrl).hostname.replace(/^www\./, "");
      if (host === currentHost || host.endsWith("." + currentHost)) return true;
    } catch {}
    return false;
  } catch {
    return false;
  }
}

// ── Couche 2 : JS injecté avant le contenu de la page ───────────────────────
const INJECTED_JS_BEFORE = `
(function() {
  // Bloquer window.open
  window.open = function() { return null; };

  // Bloquer window.location
  try {
    Object.defineProperty(window, 'location', {
      configurable: false,
      enumerable: true,
      get: function() { return window._safeLocation || location; },
      set: function() { return false; }
    });
  } catch(e) {}

  // Bloquer location.href, assign, replace
  try {
    var proto = window.Location ? window.Location.prototype : Object.getPrototypeOf(window.location);
    var _origHref = Object.getOwnPropertyDescriptor(proto, 'href');
    if (_origHref) {
      Object.defineProperty(proto, 'href', {
        get: _origHref.get,
        set: function() { return false; },
        configurable: true
      });
    }
    proto.assign   = function() { return false; };
    proto.replace  = function() { return false; };
  } catch(e) {}

  // Bloquer les clics sur liens externes (capture phase)
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (el && el.tagName === 'A') {
      var href = el.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('javascript:') && !href.startsWith('blob:')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }
    var tgt = e.target;
    if (tgt) {
      var onclick = tgt.getAttribute && tgt.getAttribute('onclick');
      var dataHref = tgt.getAttribute && tgt.getAttribute('data-href');
      if ((onclick && (onclick.includes('location') || onclick.includes('open'))) || dataHref) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }
  }, true);

  // Bloquer les soumissions de formulaire vers des URL externes
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form && form.action && form.action !== '#' && !form.action.startsWith('javascript:')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // Wrapper addEventListener pour bloquer les listeners publicitaires
  var _origAddEvent = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'click' || type === 'touchstart') {
      var el = this;
      if (el && el.getAttribute) {
        if (el.getAttribute('data-redirect') || el.getAttribute('onclick')) {
          return;
        }
      }
    }
    return _origAddEvent.call(this, type, listener, options);
  };

  // Bloquer les créations de balises <script> vers des domaines publicitaires
  var _origCreate = document.createElement.bind(document);
  document.createElement = function(tag) {
    var el = _origCreate(tag);
    return el;
  };
})();
true;
`;

const LANG_META: Record<string, { label: string; flagUrl?: string }> = {
  VOSTFR: { label: "VO",  flagUrl: `${FLAG_BASE}/flag_jp.png` },
  VO:     { label: "VO",  flagUrl: `${FLAG_BASE}/flag_jp.png` },
  VF:     { label: "VF",  flagUrl: `${FLAG_BASE}/flag_fr.png` },
  VF1:    { label: "VF1", flagUrl: `${FLAG_BASE}/flag_fr.png` },
  VF2:    { label: "VF2", flagUrl: `${FLAG_BASE}/flag_fr.png` },
  VA:     { label: "VA",  flagUrl: `${FLAG_BASE}/flag_en.png` },
  VAR:    { label: "VAR", flagUrl: `${FLAG_BASE}/flag_ar.png` },
  VKR:    { label: "VKR", flagUrl: `${FLAG_BASE}/flag_kr.png` },
  VCN:    { label: "VCN", flagUrl: `${FLAG_BASE}/flag_cn.png` },
  VQC:    { label: "VQC", flagUrl: `${FLAG_BASE}/flag_qc.png` },
};

function getEpisodeList(data: any): any[] {
  if (!data) return [];
  const list: any[] = Array.isArray(data) ? data : data.episodes ?? [];
  return list.filter((e: any) => e.available !== false);
}
function getStreamingSources(episode: any): any[] {
  if (!episode) return [];
  const sources: any[] = Array.isArray(episode.streamingSources)
    ? episode.streamingSources
    : Array.isArray(episode.sources)
      ? episode.sources
      : [];
  return [...sources].sort((a, b) => (a.serverNumber ?? 99) - (b.serverNumber ?? 99));
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
      <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
        <FlatList
          data={items}
          keyExtractor={(i) => i.value}
          style={{ maxHeight: 360 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = item.value === selected;
            return (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  isSelected && { backgroundColor: colors.neonPurple + "1A" },
                ]}
                onPress={() => { onSelect(item.value); onClose(); }}
                activeOpacity={0.75}
              >
                {isSelected && (
                  <View style={[styles.modalItemAccent, { backgroundColor: colors.neonPurple }]} />
                )}
                <Text style={[
                  styles.modalItemText,
                  { color: isSelected ? colors.neonPurple : colors.foreground },
                  isSelected && { fontWeight: "700" as const },
                ]}>
                  {item.label}
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

export default function PlayerScreen() {
  const colors = useColors();
  const {
    title,
    image,
    season,
    seasonLabel,
    seasonType,
    seasonName,
    episodeNum,
    animeId,
    language: initialLang,
    availableLanguages: availableLangsParam,
  } = useLocalSearchParams<{
    url: string; title: string; image: string;
    season: string; seasonLabel: string; seasonType: string; seasonName: string;
    episodeNum: string; animeId: string; language: string; availableLanguages: string;
  }>();

  const availableLangs: string[] = availableLangsParam
    ? availableLangsParam.split(",").filter(Boolean)
    : ["VOSTFR"];

  const [selectedLang, setSelectedLang]           = useState(initialLang ?? availableLangs[0] ?? "VOSTFR");
  const [selectedEpNum, setSelectedEpNum]         = useState(episodeNum ?? "1");
  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [showEpisodePicker, setShowEpisodePicker] = useState(false);
  const [showServerPicker, setShowServerPicker]   = useState(false);

  const webviewRef      = useRef<any>(null);
  const controlsAnim   = useRef(new Animated.Value(0)).current;
  const controlsTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsOnRef  = useRef(false);

  const showVideoControls = () => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsOnRef.current = true;
    Animated.timing(controlsAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    controlsTimer.current = setTimeout(() => {
      Animated.timing(controlsAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      controlsOnRef.current = false;
    }, 2500);
  };

  const handleFsBtnPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!controlsOnRef.current) {
      showVideoControls();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (webviewRef.current) {
        webviewRef.current.injectJavaScript(`
          (function(){
            var v=document.querySelector('video');
            if(v){ v.requestFullscreen&&v.requestFullscreen()||v.webkitRequestFullscreen&&v.webkitRequestFullscreen(); }
            else { document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen(); }
          })();true;
        `);
      }
    }
  };

  useEffect(() => {
    if (embedUrl) showVideoControls();
  }, [embedUrl]);

  const { data: episodesData, isLoading: loadingEpisodes } = useSeasonEpisodes(
    animeId ?? "", season ?? "saison1", selectedLang
  );
  const episodes = getEpisodeList(episodesData);

  const currentEpisode =
    episodes.find((e: any) => String(e.number ?? e.episode) === selectedEpNum) ?? episodes[0];
  const sources  = getStreamingSources(currentEpisode);
  const embedUrl = sources[selectedServerIdx]?.url ?? "";
  const currentServer = sources[selectedServerIdx];

  const handleOpenExternal = () => {
    if (embedUrl) Linking.openURL(embedUrl).catch(() => {});
  };

  const currentEpIndex = episodes.findIndex(
    (e: any) => String(e.number ?? e.episode ?? "") === selectedEpNum
  );
  const hasPrev = currentEpIndex > 0;
  const hasNext = currentEpIndex >= 0 && currentEpIndex < episodes.length - 1;

  const goToPrev = () => {
    if (!hasPrev) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const prev = episodes[currentEpIndex - 1];
    setSelectedEpNum(String(prev.number ?? prev.episode ?? ""));
    setSelectedServerIdx(0);
  };
  const goToNext = () => {
    if (!hasNext) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = episodes[currentEpIndex + 1];
    setSelectedEpNum(String(next.number ?? next.episode ?? ""));
    setSelectedServerIdx(0);
  };

  const episodeItems = episodes.map((ep: any) => {
    const num = ep.number ?? ep.episode ?? "?";
    const epTitle = ep.title && ep.title !== `Épisode ${num}` ? ep.title : `Épisode ${num}`;
    return { label: epTitle, value: String(num) };
  });
  const serverItems = sources.map((s: any, i: number) => ({
    label: `${s.server ?? `Serveur ${i + 1}`}${s.quality ? `  ·  ${s.quality}` : ""}`,
    value: String(i),
  }));

  const isLoading = loadingEpisodes && episodes.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          {image ? (
            <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} cachePolicy="memory-disk" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          )}
          <LinearGradient
            colors={["rgba(8,8,15,0)", "rgba(8,8,15,0.5)", "rgba(8,8,15,0.97)"]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            {season ? (() => {
              const sType = (seasonType ?? "").toLowerCase();
              const isFilm = sType === "film";
              const isOav  = sType === "oav" || sType === "ova";
              const pillIcon = isFilm ? "film" : isOav ? "star" : "layers";
              const pillLabel = isFilm
                ? (seasonName ? seasonName.toUpperCase() : "FILM")
                : isOav
                  ? (seasonName ? seasonName.toUpperCase() : "OAV")
                  : (seasonName ? seasonName : `SAISON ${seasonLabel ?? season}`);
              return (
                <View style={[styles.seasonPill, { backgroundColor: colors.neonPurple + "28", borderColor: colors.neonPurple + "55" }]}>
                  <Feather name={pillIcon as any} size={10} color={colors.neonPurple} />
                  <Text style={[styles.seasonPillText, { color: colors.neonPurple }]} numberOfLines={1}>{pillLabel}</Text>
                </View>
              );
            })() : null}
            <Text style={styles.heroTitle} numberOfLines={2}>{title ?? "Lecture"}</Text>
            <Text style={[styles.heroEpLabel, { color: "rgba(255,255,255,0.45)" }]}>
              {(() => {
                const sType = (seasonType ?? "").toLowerCase();
                const isFilm = sType === "film";
                const epTitle = currentEpisode?.title;
                const langLabel = LANG_META[selectedLang]?.label ?? selectedLang;
                if (isFilm && episodes.length <= 1) {
                  return langLabel;
                }
                if (epTitle && epTitle !== `Épisode ${selectedEpNum}`) {
                  return `${epTitle}  ·  ${langLabel}`;
                }
                return `ÉPISODE ${selectedEpNum}  ·  ${langLabel}`;
              })()}
            </Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* ── Language buttons ── */}
          <View style={styles.langRow}>
            {availableLangs.map((lang) => {
              const isActive = selectedLang === lang;
              const meta = LANG_META[lang] ?? { label: lang };
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => { setSelectedLang(lang); setSelectedServerIdx(0); }}
                  activeOpacity={0.82}
                  style={[
                    styles.langBtn,
                    isActive
                      ? { borderColor: colors.neonBlue, borderWidth: 2.5, shadowColor: colors.neonBlue, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 }
                      : { borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  {/* Flag as full background */}
                  {meta.flagUrl ? (
                    <Image
                      source={{ uri: meta.flagUrl }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
                  )}
                  {/* Dark overlay for inactive */}
                  {!isActive && (
                    <View style={[StyleSheet.absoluteFill, styles.langBtnOverlay]} />
                  )}
                  {/* Label on top */}
                  <Text style={styles.langBtnLabel}>{meta.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Episode + Server dropdowns ── */}
          <View style={styles.dropdownRow}>
            {/* Episode */}
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => episodeItems.length > 0 && setShowEpisodePicker(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.dropdownIconWrap, { backgroundColor: colors.neonPurple + "20" }]}>
                <Feather name="list" size={13} color={colors.neonPurple} />
              </View>
              <View style={styles.dropdownTextWrap}>
                <Text style={[styles.dropdownLabel, { color: colors.mutedForeground }]}>Épisode</Text>
                <Text style={[styles.dropdownValue, { color: colors.foreground }]} numberOfLines={1}>
                  {selectedEpNum}
                </Text>
              </View>
              <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Server */}
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => serverItems.length > 0 && setShowServerPicker(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.dropdownIconWrap, { backgroundColor: colors.neonBlue + "20" }]}>
                <Feather name="server" size={13} color={colors.neonBlue} />
              </View>
              <View style={styles.dropdownTextWrap}>
                <Text style={[styles.dropdownLabel, { color: colors.mutedForeground }]}>Serveur</Text>
                <Text style={[styles.dropdownValue, { color: colors.foreground }]} numberOfLines={1}>
                  {currentServer?.server ?? "—"}
                </Text>
              </View>
              {currentServer?.quality ? (
                <View style={[styles.qualityBadge, { backgroundColor: colors.neonBlue + "22", borderColor: colors.neonBlue + "55" }]}>
                  <Text style={[styles.qualityText, { color: colors.neonBlue }]}>{currentServer.quality}</Text>
                </View>
              ) : (
                <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
          </View>

          {/* ── Player ── */}
          {isLoading ? (
            <View style={[styles.playerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="loader" size={30} color={colors.neonPurple} />
              <Text style={[styles.playerMsg, { color: colors.mutedForeground }]}>
                Chargement des épisodes…
              </Text>
            </View>
          ) : !embedUrl ? (
            <View style={[styles.playerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.playerEmptyIcon, { backgroundColor: colors.neonPurple + "18", borderColor: colors.neonPurple + "33" }]}>
                <Feather name="alert-circle" size={26} color={colors.neonPurple} />
              </View>
              <Text style={[styles.playerMsg, { color: colors.mutedForeground }]}>
                {sources.length === 0
                  ? "Aucune source disponible"
                  : "Sélectionne un serveur"}
              </Text>
            </View>
          ) : Platform.OS === "web" ? (
            <View style={[styles.playerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.playerEmptyIcon, { backgroundColor: colors.neonPurple + "18", borderColor: colors.neonPurple + "33" }]}>
                <Feather name="play" size={26} color={colors.neonPurple} />
              </View>
              <Text style={[styles.playerMsg, { color: colors.foreground }]}>Lecture externe</Text>
              <TouchableOpacity
                style={styles.openBtnWrap}
                onPress={handleOpenExternal}
                activeOpacity={0.82}
              >
                <LinearGradient
                  colors={[colors.neonPurple, colors.neonBlue]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.openBtn}
                >
                  <Feather name="external-link" size={14} color="#fff" />
                  <Text style={styles.openBtnText}>Ouvrir le lecteur</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={[styles.webviewContainer, { borderColor: colors.neonPurple + "44" }]}>
                <WebView
                  ref={webviewRef}
                  key={embedUrl}
                  source={{ uri: embedUrl }}
                  style={styles.webview}
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled
                  domStorageEnabled
                  startInLoadingState

                  // ── Couche 1 : Props natives anti-popup ──────────────────
                  setSupportMultipleWindows={false}
                  allowFileAccess={false}
                  allowUniversalAccessFromFileURLs={false}
                  mixedContentMode="never"
                  originWhitelist={["*"]}

                  // ── Couche 2 : JS injecté avant le chargement ────────────
                  injectedJavaScriptBeforeContentLoaded={INJECTED_JS_BEFORE}

                  // ── Couche 3 : Whitelist native des domaines ─────────────
                  onShouldStartLoadWithRequest={(request) => {
                    const url = request.url;
                    if (!url || url === "about:blank" || url.startsWith("blob:")) return true;
                    if (BLOCKED_SCHEMES.some((s) => url.startsWith(s))) return false;
                    return isDomainAllowed(url, embedUrl);
                  }}

                  // ── Couche 4 : Bloquer toute nouvelle fenêtre ────────────
                  onOpenWindow={() => false}

                  renderLoading={() => (
                    <View style={[StyleSheet.absoluteFill, styles.webviewLoader, { backgroundColor: colors.card }]}>
                      <Feather name="loader" size={24} color={colors.neonPurple} />
                      <Text style={[styles.playerMsg, { color: colors.mutedForeground, marginTop: 10 }]}>Chargement…</Text>
                    </View>
                  )}
                />
              </View>

              {/* Fullscreen overlay — box-none so WebView keeps its touches */}
              <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                <Animated.View style={[styles.fsOverlay, { opacity: controlsAnim }]} pointerEvents="box-none">
                  <TouchableOpacity
                    style={[styles.fsBtn, { backgroundColor: "rgba(0,0,0,0.62)", borderColor: "rgba(255,255,255,0.18)" }]}
                    onPress={handleFsBtnPress}
                    activeOpacity={0.75}
                  >
                    <Feather name="maximize" size={16} color="#fff" />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          )}

          {/* ── Prev / Next episode ── */}
          {episodes.length > 0 && (
            <View style={styles.epNavRow}>
              <TouchableOpacity
                style={[
                  styles.epNavBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  !hasPrev && styles.epNavBtnDisabled,
                ]}
                onPress={goToPrev}
                activeOpacity={hasPrev ? 0.8 : 1}
                disabled={!hasPrev}
              >
                <Feather name="chevron-left" size={20} color={hasPrev ? colors.foreground : colors.mutedForeground} />
                <Text style={[styles.epNavText, { color: hasPrev ? colors.foreground : colors.mutedForeground }]}>
                  Précédent
                </Text>
              </TouchableOpacity>

              <View style={[styles.epNavCurrent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.epNavCurrentText, { color: colors.neonPurple }]}>
                  ÉP. {selectedEpNum}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.epNavBtn,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  !hasNext && styles.epNavBtnDisabled,
                ]}
                onPress={goToNext}
                activeOpacity={hasNext ? 0.8 : 1}
                disabled={!hasNext}
              >
                <Text style={[styles.epNavText, { color: hasNext ? colors.foreground : colors.mutedForeground }]}>
                  Suivant
                </Text>
                <Feather name="chevron-right" size={20} color={hasNext ? colors.foreground : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <PickerModal
        visible={showEpisodePicker}
        title="Choisir un épisode"
        items={episodeItems}
        selected={selectedEpNum}
        onSelect={(v) => { setSelectedEpNum(v); setSelectedServerIdx(0); }}
        onClose={() => setShowEpisodePicker(false)}
        colors={colors}
      />
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

  hero: { height: 260, justifyContent: "flex-end", position: "relative" },
  heroContent: { paddingHorizontal: 18, paddingBottom: 20, gap: 6 },
  seasonPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, marginBottom: 4,
  },
  seasonPillText: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 1.2 },
  heroTitle: {
    color: "#fff", fontSize: 26, fontWeight: "800" as const,
    letterSpacing: -0.5, lineHeight: 32,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  heroEpLabel: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.8, marginTop: 2 },

  body: { paddingHorizontal: 16, paddingTop: 22, gap: 14, paddingBottom: 30 },

  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  langBtn: {
    width: 76, height: 52,
    borderRadius: 12, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  langBtnOverlay: { backgroundColor: "rgba(0,0,0,0.52)", borderRadius: 12 },
  langBtnLabel: {
    color: "#fff", fontSize: 13, fontWeight: "800" as const,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  dropdownRow: { flexDirection: "row", gap: 10 },
  dropdown: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  dropdownIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dropdownTextWrap: { flex: 1 },
  dropdownLabel: { fontSize: 9, fontWeight: "600" as const, letterSpacing: 0.8, textTransform: "uppercase" },
  dropdownValue: { fontSize: 14, fontWeight: "700" as const, marginTop: 1 },
  qualityBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  qualityText: { fontSize: 9, fontWeight: "800" as const, letterSpacing: 0.5 },

  playerBox: {
    height: 210, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center", gap: 14,
  },
  playerEmptyIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  playerMsg: { fontSize: 14, textAlign: "center", paddingHorizontal: 24, lineHeight: 20 },
  openBtnWrap: { marginTop: 4 },
  openBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  openBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" as const },

  epNavRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4,
  },
  epNavBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  epNavBtnDisabled: { opacity: 0.4 },
  epNavText: { fontSize: 13, fontWeight: "700" as const },
  epNavCurrent: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  epNavCurrentText: { fontSize: 12, fontWeight: "800" as const, letterSpacing: 0.5 },

  fsOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  fsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  webviewContainer: {
    aspectRatio: 16 / 9,
    borderRadius: 14, borderWidth: 1.5,
    overflow: "hidden",
    ...Platform.select({ ios: { shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }, android: {} }),
  },
  webview: { flex: 1 },
  webviewLoader: { alignItems: "center", justifyContent: "center" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 14, paddingBottom: 36, paddingHorizontal: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  modalTitle: { fontSize: 16, fontWeight: "800" as const, marginBottom: 10, letterSpacing: -0.2 },
  modalItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 4, position: "relative",
  },
  modalItemAccent: { width: 3, height: "100%" as any, borderRadius: 2, position: "absolute", left: 0, top: 0 },
  modalItemText: { flex: 1, fontSize: 14, fontWeight: "500" as const },
  modalCheck: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
});
