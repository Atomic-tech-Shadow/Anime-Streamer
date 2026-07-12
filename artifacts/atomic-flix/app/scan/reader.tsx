import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  Image as RNImage,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { useScanChapter } from "@/hooks/useAnime";
import SpinnerLoader from "@/components/SpinnerLoader";

const AnimatedImage = Reanimated.createAnimatedComponent(Image);
const MAX_SCALE = 4;
const MIN_SCALE = 1;
const DOUBLE_TAP_SCALE = 2.4;

function ScanPage({
  uri,
  width,
  height,
  colors,
  onZoomChange,
}: {
  uri: string;
  width: number;
  height: number;
  colors: any;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  // Plain JS state (not a shared value) so it can gate .enabled() on the pan
  // gesture below. Without this, the single-finger Pan gesture claims every
  // touch — even at 1x zoom where it's a no-op — which steals the touch from
  // the parent FlatList and makes normal one-finger scrolling stop working
  // (only two-finger drags reach the list).
  const [isZoomed, setIsZoomed] = useState(false);

  // Clamp pan so the zoomed image stays within visible bounds.
  const clampTranslation = (s: number, tx: number, ty: number) => {
    "worklet";
    const maxX = Math.max(0, (width * s - width) / 2);
    const maxY = Math.max(0, (height * s - height) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, tx)),
      y: Math.min(maxY, Math.max(-maxY, ty)),
    };
  };

  const reportZoom = (zoomed: boolean) => {
    setIsZoomed(zoomed);
    onZoomChange(zoomed);
  };

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      focalX.value = e.focalX - width / 2;
      focalY.value = e.focalY - height / 2;
    })
    .onUpdate((e) => {
      const next = Math.min(MAX_SCALE, Math.max(0.8, savedScale.value * e.scale));
      scale.value = next;
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE, { duration: 180 });
        translateX.value = withTiming(0, { duration: 180 });
        translateY.value = withTiming(0, { duration: 180 });
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(reportZoom)(false);
      } else {
        savedScale.value = scale.value;
        const c = clampTranslation(scale.value, translateX.value, translateY.value);
        translateX.value = withTiming(c.x, { duration: 120 });
        translateY.value = withTiming(c.y, { duration: 120 });
        savedTranslateX.value = c.x;
        savedTranslateY.value = c.y;
        runOnJS(reportZoom)(scale.value > 1.02);
      }
    });

  // Pan only activates when zoomed in (so vertical scroll still works at 1x).
  // `.enabled()` fully disables gesture recognition at 1x zoom, so the
  // touch is never claimed here and falls through to the parent FlatList's
  // native scroll responder — that's what makes one-finger scroll work again.
  const pan = Gesture.Pan()
    .enabled(isZoomed)
    .minPointers(1)
    .maxPointers(1)
    .averageTouches(true)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1.02) return;
      const c = clampTranslation(
        scale.value,
        savedTranslateX.value + e.translationX,
        savedTranslateY.value + e.translationY,
      );
      translateX.value = c.x;
      translateY.value = c.y;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(220)
    .onEnd((e) => {
      if (scale.value > 1.02) {
        scale.value = withTiming(1, { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(reportZoom)(false);
      } else {
        const cx = e.x - width / 2;
        const cy = e.y - height / 2;
        const tx = -cx * (DOUBLE_TAP_SCALE - 1);
        const ty = -cy * (DOUBLE_TAP_SCALE - 1);
        const c = clampTranslation(DOUBLE_TAP_SCALE, tx, ty);
        scale.value = withTiming(DOUBLE_TAP_SCALE, { duration: 200 });
        translateX.value = withTiming(c.x, { duration: 200 });
        translateY.value = withTiming(c.y, { duration: 200 });
        savedScale.value = DOUBLE_TAP_SCALE;
        savedTranslateX.value = c.x;
        savedTranslateY.value = c.y;
        runOnJS(reportZoom)(true);
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={[styles.pageWrap, { width, height, backgroundColor: colors.background, overflow: "hidden" }]}>
      <GestureDetector gesture={composed}>
        <AnimatedImage
          source={{ uri }}
          style={[{ width, height, backgroundColor: colors.card }, animatedStyle]}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={120}
          recyclingKey={uri}
          priority="high"
        />
      </GestureDetector>
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
  const [showPicker, setShowPicker] = useState(false);
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

  // ── Pre-measure all pages + prefetch into cache ────────────────────────
  // Avoids layout shifts (each page has a fixed height before render) and
  // makes scrolling feel instant since pages are already in memory/disk.
  const [heights, setHeights] = useState<number[]>([]);
  const fallbackHeight = SCREEN_WIDTH * 1.4;

  useEffect(() => {
    if (images.length === 0) {
      setHeights([]);
      return;
    }
    let cancelled = false;
    setHeights([]);

    // Warm the disk/memory cache for every page in parallel.
    Image.prefetch(images, "memory-disk");

    Promise.all(
      images.map(
        (uri) =>
          new Promise<number>((resolve) => {
            RNImage.getSize(
              uri,
              (w, h) => resolve(w > 0 ? (h / w) * SCREEN_WIDTH : fallbackHeight),
              () => resolve(fallbackHeight),
            );
          }),
      ),
    ).then((hs) => {
      if (!cancelled) setHeights(hs);
    });

    return () => {
      cancelled = true;
    };
  }, [images, SCREEN_WIDTH, fallbackHeight]);

  // Cumulative offsets for getItemLayout (fast, O(1) per call once computed).
  const offsets = useMemo(() => {
    const out: number[] = [0];
    for (let i = 0; i < heights.length; i++) {
      out.push(out[i] + heights[i]);
    }
    return out;
  }, [heights]);

  const allMeasured = heights.length === images.length && images.length > 0;

  // ── Reset progress + scroll to top when chapter changes ────────────────
  useEffect(() => {
    setProgress(0);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [current]);

  // True when any page is currently zoomed in — disables list scroll so
  // single-finger pan moves the zoomed image instead of scrolling chapters.
  const [anyPageZoomed, setAnyPageZoomed] = useState(false);
  const zoomedPagesRef = useRef<Set<string>>(new Set());
  const handlePageZoom = (uri: string, zoomed: boolean) => {
    if (zoomed) zoomedPagesRef.current.add(uri);
    else zoomedPagesRef.current.delete(uri);
    setAnyPageZoomed(zoomedPagesRef.current.size > 0);
  };

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
        <View style={{ flex: 1 }}>
          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(uri, i) => `${current}-${i}`}
            renderItem={({ item, index }) => (
              <ScanPage
                uri={item}
                width={SCREEN_WIDTH}
                height={heights[index] ?? fallbackHeight}
                colors={colors}
                onZoomChange={(z) => handlePageZoom(item, z)}
              />
            )}
            scrollEnabled={!anyPageZoomed}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={11}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={32}
            getItemLayout={
              allMeasured
                ? (_, index) => ({
                    length: heights[index],
                    offset: offsets[index],
                    index,
                  })
                : undefined
            }
            contentContainerStyle={{
              paddingTop: insets.top + 60,
              paddingBottom: insets.bottom + 24,
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
        </View>
      )}

      {/* ── Top bar (permanent) ────────────────────────────────────────── */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 6 }]}>
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
      </View>

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
