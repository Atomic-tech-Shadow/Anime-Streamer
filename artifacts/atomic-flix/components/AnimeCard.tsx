import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

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

interface AnimeCardProps {
  title: string;
  image?: string;
  type?: string;
  episode?: string | number;
  language?: string;
  season?: string | number;
  onPress?: () => void;
  size?: "small" | "medium" | "large";
  badge?: string;
}

const DIMENSIONS = {
  small:  { width: 112, height: 158 },
  medium: { width: 142, height: 200 },
  large:  { width: 182, height: 257 },
};

export default function AnimeCard({
  title, image, type, episode, language, season, onPress, size = "medium", badge,
}: AnimeCardProps) {
  const colors = useColors();
  const dim    = DIMENSIONS[size];
  const flagUrl = language ? LANG_FLAG_URL[language.toUpperCase()] : undefined;
  const scale  = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 180,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 180,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.container, { width: dim.width }]}
    >
      <Animated.View style={[
        styles.card,
        { width: dim.width, height: dim.height, backgroundColor: colors.card },
        { transform: [{ scale }] },
      ]}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />
        )}

        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.neonPurple }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        {(episode !== undefined || language) && (
          <View style={[styles.episodePill, { backgroundColor: "rgba(8,8,15,0.82)", borderColor: "rgba(255,255,255,0.15)" }]}>
            {flagUrl && (
              <Image
                source={{ uri: flagUrl }}
                style={styles.pillFlag}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            )}
            {episode !== undefined && (
              <Text style={[styles.episodeText, { color: "#fff" }]}>
                {season ? `S${season} ` : ""}EP {episode}
              </Text>
            )}
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(8,8,15,0.65)", "rgba(8,8,15,0.96)"]}
          locations={[0, 0.45, 1]}
          style={styles.gradient}
          pointerEvents="none"
        >
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {type && (
            <Text style={styles.typeLabel} numberOfLines={1}>{type}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginRight: 12 },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },

  badge: {
    position: "absolute", top: 8, left: 8,
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6, zIndex: 2,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" as const, letterSpacing: 0.5 },

  episodePill: {
    position: "absolute", top: 8, right: 8,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, zIndex: 2,
  },
  pillFlag: { width: 16, height: 11, borderRadius: 2 },
  episodeText: { fontSize: 9, fontWeight: "800" as const, letterSpacing: 0.3 },

  gradient: {
    paddingTop: 22,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700" as const,
    lineHeight: 15,
    letterSpacing: -0.1,
  },
  typeLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "600" as const,
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
