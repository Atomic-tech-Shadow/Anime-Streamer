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
  const [progress, setProgress] = useState(0);
  const slideAnim = useRef(new Animated.Value(100)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const showBanner = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setBannerState("idle"));
  };

  useEffect(() => {
    if (Platform.OS === "web" || __DEV__) return;

    const checkUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          setBannerState("available");
          showBanner();
        }
      } catch (_) {}
    };

    checkUpdate();
  }, []);

  const handleDownload = async () => {
    setBannerState("downloading");
    setProgress(0);
    Animated.timing(progressAnim, { toValue: 0, duration: 0, useNativeDriver: false }).start();

    try {
      // Animate progress smoothly
      const fakeProgress = Animated.timing(progressAnim, {
        toValue: 0.85,
        duration: 4000,
        useNativeDriver: false,
      });
      fakeProgress.start();

      await Updates.fetchUpdateAsync();

      fakeProgress.stop();
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        setBannerState("ready");
      });
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
        { bottom: insets.bottom + 70, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.banner, { backgroundColor: colors.primary }]}>
        {/* Icon */}
        <View style={styles.iconBox}>
          <Feather
            name={bannerState === "ready" ? "refresh-cw" : "download-cloud"}
            size={18}
            color="#fff"
          />
        </View>

        {/* Text */}
        <View style={styles.textBox}>
          {bannerState === "available" && (
            <Text style={styles.text}>Mise à jour disponible</Text>
          )}
          {bannerState === "downloading" && (
            <>
              <Text style={styles.text}>Téléchargement...</Text>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
            </>
          )}
          {bannerState === "ready" && (
            <Text style={styles.text}>Prêt à installer</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {bannerState === "available" && (
            <>
              <TouchableOpacity onPress={hideBanner} style={styles.btnLater}>
                <Text style={styles.btnLaterText}>Plus tard</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDownload} style={styles.btnNow}>
                <Text style={styles.btnNowText}>Télécharger</Text>
              </TouchableOpacity>
            </>
          )}
          {bannerState === "ready" && (
            <TouchableOpacity onPress={handleApply} style={styles.btnNow}>
              <Text style={styles.btnNowText}>Mettre à jour</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  textBox: {
    flex: 1,
    gap: 4,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  btnLater: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnLaterText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "500",
  },
  btnNow: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnNowText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
