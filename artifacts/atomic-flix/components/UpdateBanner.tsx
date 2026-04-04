import * as Updates from "expo-updates";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type BannerState = "idle" | "available" | "downloading" | "ready";

export default function UpdateBanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [bannerState, setBannerState] = useState<BannerState>("idle");
  const [description, setDescription] = useState<string>("");
  const slideAnim = useRef(new Animated.Value(120)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const showBanner = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: 120,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setBannerState("idle"));
  };

  useEffect(() => {
    if (Platform.OS === "web" || __DEV__) return;

    const checkUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          const manifest = result.manifest as any;
          const msg =
            manifest?.metadata?.message ||
            manifest?.extra?.expoClient?.extra?.updateMessage ||
            "Améliorations de performances et corrections de bugs.";
          setDescription(msg);
          setBannerState("available");
          showBanner();
        }
      } catch (_) {}
    };

    const timer = setTimeout(checkUpdate, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = async () => {
    setBannerState("downloading");
    progressAnim.setValue(0);

    try {
      const fakeProgress = Animated.timing(progressAnim, {
        toValue: 0.88,
        duration: 5000,
        useNativeDriver: false,
      });
      fakeProgress.start();

      await Updates.fetchUpdateAsync();

      fakeProgress.stop();
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }).start(() => setBannerState("ready"));
    } catch (_) {
      hideBanner();
    }
  };

  const handleApply = async () => {
    try {
      await Updates.reloadAsync();
    } catch (_) {}
  };

  if (bannerState === "idle") return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: insets.bottom + 76, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
            <Feather
              name={bannerState === "ready" ? "refresh-cw" : "download-cloud"}
              size={16}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {bannerState === "ready" ? "Prêt à installer" : "Mise à jour disponible"}
          </Text>
        </View>

        {/* ── Description / Progress ── */}
        <View style={styles.body}>
          {(bannerState === "available" || bannerState === "ready") && description ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {description}
            </Text>
          ) : null}

          {bannerState === "downloading" && (
            <View style={styles.progressSection}>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                Téléchargement en cours…
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* ── Buttons ── */}
        {bannerState !== "downloading" && (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {bannerState === "available" && (
              <>
                <TouchableOpacity onPress={hideBanner} style={styles.btnLater}>
                  <Text style={[styles.btnLaterText, { color: colors.mutedForeground }]}>
                    Plus tard
                  </Text>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  onPress={handleDownload}
                  style={styles.btnPrimary}
                >
                  <Feather name="download" size={14} color={colors.primary} />
                  <Text style={[styles.btnPrimaryText, { color: colors.primary }]}>
                    Télécharger maintenant
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {bannerState === "ready" && (
              <>
                <TouchableOpacity onPress={hideBanner} style={styles.btnLater}>
                  <Text style={[styles.btnLaterText, { color: colors.mutedForeground }]}>
                    Ignorer
                  </Text>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  onPress={handleApply}
                  style={styles.btnPrimary}
                >
                  <Feather name="refresh-cw" size={14} color={colors.primary} />
                  <Text style={[styles.btnPrimaryText, { color: colors.primary }]}>
                    Mettre à jour maintenant
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressSection: {
    gap: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    height: 44,
  },
  btnLater: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  btnLaterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 20,
  },
  btnPrimary: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: "100%",
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
