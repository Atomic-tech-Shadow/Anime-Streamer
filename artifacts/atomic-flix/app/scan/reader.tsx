import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useScanChapter } from "@/hooks/useAnime";
import SpinnerLoader from "@/components/SpinnerLoader";

interface PageImage {
  uri: string;
  ratio: number; // height/width ratio, used while loading
}

function ScanPage({
  uri,
  width,
  colors,
}: {
  uri: string;
  width: number;
  colors: any;
}) {
  // 0 = loading, ratio when known
  const [ratio, setRatio] = useState<number>(1.4); // ~A4 default

  return (
    <View style={[styles.pageWrap, { width, backgroundColor: colors.background }]}>
      <Image
        source={{ uri }}
        style={{ width, height: width * ratio, backgroundColor: colors.card }}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={200}
        onLoad={(e) => {
          const src: any = (e as any)?.source;
          const w = src?.width;
          const h = src?.height;
          if (w && h && w > 0) setRatio(h / w);
        }}
      />
    </View>
  );
}

function ChapterPicker({
  visible, current, total, onSelect, onClose, colors,
}: {
  visible: boolean;
  current: number;
  total: number;
  onSelect: (n: number) => void;
  onClose: () => void;
  colors: any;
}) {
  const numbers = useMemo(
    () => Array.from({ length: Math.max(total, 0) }, (_, i) => i + 1),
    [total]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.modalTitle, { color: colors.foreground }]}>
          Chapitre · {total} disponibles
        </Text>
        <FlatList
          data={numbers}
          keyExtractor={(n) => String(n)}
          style={{ maxHeight: 420 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={30}
          getItemLayout={(_, i) => ({ length: 46, offset: 46 * i, index: i })}
          initialScrollIndex={Math.max(0, current - 5)}
          renderItem={({ item }) => {
            const isSelected = item === current;
            return (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  isSelected && { backgroundColor: colors.neonPurple + "1A" },
                ]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.modalItemText,
                  { color: isSelected ? colors.neonPurple : colors.foreground },
                  isSelected && { fontWeight: "800" as const },
                ]}>
                  Chapitre {item}
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

export default function ScanReaderScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const {
    id,
    season,
    language,
    availableLanguages,
    chapter: chapterParam,
    title,
    image,
    total: totalParam,
  } = useLocalSearchParams<{
    id: string;
    season: string;
    language: string;
    availableLanguages: string;
    chapter: string;
    title: string;
    image: string;
    total: string;
  }>();

  const initialChapter = parseInt(chapterParam ?? "1", 10) || 1;
  const totalChapters  = parseInt(totalParam ?? "0", 10) || 0;
  const [current, setCurrent]     = useState(initialChapter);
  const [progress, setProgress]   = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showPicker, setShowPicker]   = useState(false);

  const overlayAnim = useRef(new Animated.Value(1)).current;
  const listRef = useRef<FlatList<any>>(null);

  const seasonValue = season ?? "scan";
  const lang        = language ?? "VF";
  const realTitle   = title ?? "Scan";

  const { data, isLoading, isError, refetch } = useScanChapter(
    id ?? "",
    current,
    lang,
    seasonValue,
  );

  const chapter = data?.chapter;
  const images: string[] = chapter?.images ?? [];
  const pageCount = chapter?.pageCount ?? images.length;

  // ── Reset progress + scroll to top when chapter changes ────────────────
  useEffect(() => {
    setProgress(0);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [current]);

  // ── Toggle overlay (auto hide after 2.5s) ──────────────────────────────
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animateOverlay = (visible: boolean) => {
    Animated.timing(overlayAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  const showOverlayWithTimeout = () => {
    setShowOverlay(true);
    animateOverlay(true);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => {
      animateOverlay(false);
      setShowOverlay(false);
    }, 2800);
  };
  const toggleOverlay = () => {
    Haptics.selectionAsync();
    if (showOverlay) {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      animateOverlay(false);
      setShowOverlay(false);
    } else {
      showOverlayWithTimeout();
    }
  };
  useEffect(() => {
    showOverlayWithTimeout();
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [current]);

  const goToChapter = (n: number) => {
    if (totalChapters && (n < 1 || n > totalChapters)) return;
    if (n < 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrent(n);
  };

  const handleScroll = (e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = Math.max(contentSize.height - layoutMeasurement.height, 1);
    const ratio = Math.max(0, Math.min(1, contentOffset.y / max));
    setProgress(ratio);
  };

  const canPrev = current > 1;
  const canNext = !totalChapters || current < totalChapters;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={{ flex: 1 }}>
          <SpinnerLoader fullscreen />
        </View>
      ) : isError || !chapter ? (
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.destructive + "1A", borderColor: colors.destructive + "44" }]}>
            <Feather name="alert-triangle" size={22} color={colors.destructive} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            Impossible de charger ce chapitre
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryBtn, { backgroundColor: colors.neonPurple }]}
              activeOpacity={0.85}
            >
              <Feather name="refresh-cw" size={14} color="#fff" />
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.retryBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
              activeOpacity={0.85}
            >
              <Feather name="arrow-left" size={14} color={colors.foreground} />
              <Text style={[styles.retryBtnText, { color: colors.foreground }]}>Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={1} onPress={toggleOverlay} style={{ flex: 1 }}>
          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(uri, i) => `${current}-${i}`}
            renderItem={({ item }) => (
              <ScanPage uri={item} width={SCREEN_WIDTH} colors={colors} />
            )}
            initialNumToRender={3}
            maxToRenderPerBatch={4}
            windowSize={5}
            removeClippedSubviews
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={32}
            contentContainerStyle={{
              paddingTop: insets.top + 60,
              paddingBottom: insets.bottom + 80,
            }}
            ListFooterComponent={
              <View style={[styles.endCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.endIcon, { backgroundColor: colors.neonPurple + "1F", borderColor: colors.neonPurple + "55" }]}>
                  <Feather name="check" size={16} color={colors.neonPurple} />
                </View>
                <Text style={[styles.endTitle, { color: colors.foreground }]}>
                  Fin du chapitre {current}
                </Text>
                {canNext ? (
                  <TouchableOpacity
                    onPress={() => goToChapter(current + 1)}
                    style={[styles.nextChapterBtn, { backgroundColor: colors.neonPurple }]}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.nextChapterText}>Chapitre suivant</Text>
                    <Feather name="arrow-right" size={14} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.endHint, { color: colors.mutedForeground }]}>
                    Dernier chapitre disponible
                  </Text>
                )}
              </View>
            }
          />
        </TouchableOpacity>
      )}

      {/* ── Top overlay ───────────────────────────────────────────────── */}
      <Animated.View
        pointerEvents={showOverlay ? "auto" : "none"}
        style={[
          styles.topOverlay,
          { paddingTop: insets.top + 6, opacity: overlayAnim },
        ]}
      >
        <LinearGradient
          colors={["rgba(8,8,15,0.92)", "rgba(8,8,15,0)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
            style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: "rgba(255,255,255,0.12)" }]}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 12, minWidth: 0 }}>
            <Text style={styles.topTitle} numberOfLines={1}>{realTitle}</Text>
            <Text style={styles.topSubtitle}>
              Chapitre {current}{totalChapters ? ` / ${totalChapters}` : ""} · {pageCount || "—"} pages
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setShowPicker(true); }}
            style={[styles.iconBtn, { backgroundColor: colors.neonPurple, borderColor: colors.neonPurple }]}
            activeOpacity={0.85}
          >
            <Feather name="list" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.neonPurple },
            ]}
          />
        </View>
      </Animated.View>

      {/* ── Bottom overlay (prev / next) ──────────────────────────────── */}
      <Animated.View
        pointerEvents={showOverlay ? "auto" : "none"}
        style={[
          styles.bottomOverlay,
          { paddingBottom: insets.bottom + 12, opacity: overlayAnim },
        ]}
      >
        <LinearGradient
          colors={["rgba(8,8,15,0)", "rgba(8,8,15,0.92)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bottomRow}>
          <TouchableOpacity
            onPress={() => goToChapter(current - 1)}
            disabled={!canPrev}
            style={[
              styles.navBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: canPrev ? 1 : 0.4,
              },
            ]}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={18} color={colors.foreground} />
            <Text style={[styles.navBtnText, { color: colors.foreground }]}>Précédent</Text>
          </TouchableOpacity>

          <View style={[styles.chapterPill, { backgroundColor: colors.neonPurple + "1F", borderColor: colors.neonPurple + "55" }]}>
            <Feather name="book-open" size={12} color={colors.neonPurple} />
            <Text style={[styles.chapterPillText, { color: colors.neonPurple }]}>{current}</Text>
          </View>

          <TouchableOpacity
            onPress={() => goToChapter(current + 1)}
            disabled={!canNext}
            style={[
              styles.navBtn,
              {
                backgroundColor: colors.neonPurple,
                borderColor: colors.neonPurple,
                opacity: canNext ? 1 : 0.4,
              },
            ]}
            activeOpacity={0.85}
          >
            <Text style={[styles.navBtnText, { color: "#fff" }]}>Suivant</Text>
            <Feather name="chevron-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ChapterPicker
        visible={showPicker}
        current={current}
        total={totalChapters || pageCount}
        onSelect={(n) => goToChapter(n)}
        onClose={() => setShowPicker(false)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  pageWrap: { backgroundColor: "#000" },

  topOverlay: {
    position: "absolute", left: 0, right: 0, top: 0,
    paddingHorizontal: 12, paddingBottom: 10,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  topTitle: { color: "#fff", fontSize: 14, fontWeight: "800" as const, letterSpacing: -0.2 },
  topSubtitle: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600" as const, marginTop: 2 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  progressTrack: {
    height: 3, backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 2, marginTop: 10, overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },

  bottomOverlay: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: 14, paddingTop: 18,
  },
  bottomRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    justifyContent: "space-between",
  },
  navBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, flex: 1,
    justifyContent: "center",
  },
  navBtnText: { fontSize: 13, fontWeight: "700" as const },
  chapterPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  chapterPillText: { fontSize: 13, fontWeight: "800" as const, letterSpacing: 0.3 },

  endCard: {
    marginHorizontal: 16, marginTop: 16,
    padding: 18, borderRadius: 16, borderWidth: 1,
    alignItems: "center", gap: 10,
  },
  endIcon: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  endTitle: { fontSize: 15, fontWeight: "800" as const },
  endHint: { fontSize: 12, fontWeight: "500" as const },
  nextChapterBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12,
    marginTop: 4,
  },
  nextChapterText: { color: "#fff", fontSize: 13, fontWeight: "800" as const, letterSpacing: 0.3 },

  errorState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  errorIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
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
    borderRadius: 10, marginBottom: 4, height: 44,
  },
  modalItemText: { flex: 1, fontSize: 14, fontWeight: "500" as const },
  modalCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
});
