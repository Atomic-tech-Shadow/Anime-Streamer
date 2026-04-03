import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AnimeCardProps {
  title: string;
  image?: string;
  type?: string;
  episode?: string | number;
  onPress?: () => void;
  size?: "small" | "medium" | "large";
  badge?: string;
}

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

  const dimensions = {
    small: { width: 110, height: 155 },
    medium: { width: 140, height: 198 },
    large: { width: 180, height: 254 },
  }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.container, { width: dimensions.width }]}
    >
      <View
        style={[
          styles.imageContainer,
          {
            width: dimensions.width,
            height: dimensions.height,
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
            style={[
              StyleSheet.absoluteFill,
              styles.placeholder,
              { backgroundColor: colors.secondary },
            ]}
          />
        )}
        <View style={styles.gradient} />
        {badge && (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.neonPurple },
            ]}
          >
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {episode !== undefined && (
          <View
            style={[styles.episodeBadge, { backgroundColor: colors.overlay }]}
          >
            <Text style={[styles.episodeText, { color: colors.neonBlue }]}>
              EP {episode}
            </Text>
          </View>
        )}
        <View style={styles.infoOverlay}>
          <Text style={styles.titleOverlay} numberOfLines={2}>
            {title}
          </Text>
          {type && (
            <Text style={styles.typeOverlay} numberOfLines={1}>
              {type}
            </Text>
          )}
        </View>
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
  placeholder: {
    flex: 1,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(8,8,15,0.75)",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  episodeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  episodeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  infoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  titleOverlay: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700" as const,
    lineHeight: 15,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  typeOverlay: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
    fontWeight: "500" as const,
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
