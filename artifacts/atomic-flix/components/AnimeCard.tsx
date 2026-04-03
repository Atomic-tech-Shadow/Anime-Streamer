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
        <View
          style={[
            styles.gradient,
            { backgroundColor: "rgba(8,8,15,0.6)" },
          ]}
        />
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
      </View>
      <Text
        style={[styles.title, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {title}
      </Text>
      {type && (
        <Text style={[styles.type, { color: colors.mutedForeground }]}>
          {type}
        </Text>
      )}
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
    height: "40%",
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
    bottom: 8,
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
  title: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 16,
  },
  type: {
    marginTop: 2,
    fontSize: 10,
  },
});
