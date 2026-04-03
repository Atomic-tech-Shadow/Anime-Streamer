import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

interface AnimeCardProps {
  title: string;
  image?: string;
  type?: string;
  episode?: string | number;
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
  title, image, type, episode, onPress, size = "medium", badge,
}: AnimeCardProps) {
  const colors = useColors();
  const dim    = DIMENSIONS[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={[styles.container, { width: dim.width }]}
    >
      <View style={[styles.card, { width: dim.width, height: dim.height, backgroundColor: colors.card }]}>
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />
        )}

        {/* Top-left: custom badge */}
        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.neonPurple }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        {/* Top-right: episode pill */}
        {episode !== undefined && (
          <View style={[styles.episodePill, { backgroundColor: "rgba(8,8,15,0.75)", borderColor: colors.neonBlue + "66" }]}>
            <View style={[styles.episodeDot, { backgroundColor: colors.neonBlue }]} />
            <Text style={[styles.episodeText, { color: "#fff" }]}>
              {episode}
            </Text>
          </View>
        )}

        {/* Bottom gradient + title */}
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
      </View>
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
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, zIndex: 2,
  },
  episodeDot: { width: 5, height: 5, borderRadius: 3 },
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
