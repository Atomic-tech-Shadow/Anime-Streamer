import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
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
  small:  { width: 110, height: 155 },
  medium: { width: 140, height: 198 },
  large:  { width: 180, height: 254 },
};

export default function AnimeCard({
  title,
  image,
  type,
  episode,
  onPress,
  size = "medium",
  badge,
}: AnimeCardProps) {
  const colors = useColors();
  const dim = DIMENSIONS[size];
  const gradientHeight = type ? 56 : 44;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.container, { width: dim.width }]}
    >
      <View
        style={[
          styles.imageContainer,
          {
            width: dim.width,
            height: dim.height,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]}
          />
        )}

        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.neonPurple }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        {episode !== undefined && (
          <View style={[styles.episodeBadge, { backgroundColor: colors.overlay }]}>
            <Text style={[styles.episodeText, { color: colors.neonBlue }]}>
              EP {episode}
            </Text>
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(8,8,15,0.92)"]}
          style={[styles.gradient, { height: gradientHeight }]}
        >
          <Text style={styles.titleOverlay} numberOfLines={2}>
            {title}
          </Text>
          {type && (
            <Text style={styles.typeOverlay} numberOfLines={1}>
              {type}
            </Text>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
  imageContainer: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  badge: {
    position: "absolute",
    top: 7,
    left: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 0.4,
  },
  episodeBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  episodeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 0.4,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 7,
    paddingBottom: 7,
  },
  titleOverlay: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700" as const,
    lineHeight: 14,
  },
  typeOverlay: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "500" as const,
    marginTop: 2,
    lineHeight: 12,
  },
});
