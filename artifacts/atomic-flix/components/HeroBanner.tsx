import React, { useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HeroBannerProps {
  title: string;
  image?: string;
  type?: string;
  onPress?: () => void;
  onPlay?: () => void;
}

export default function HeroBanner({
  title,
  image,
  type,
  onPress,
  onPlay,
}: HeroBannerProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: false }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[styles.container, { transform: [{ scale }] }]}
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
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              background: undefined,
              backgroundColor: undefined,
            },
          ]}
        >
          <View
            style={[
              styles.gradientOverlay,
              { backgroundColor: "rgba(8,8,15,0.3)" },
            ]}
          />
          <View
            style={[
              styles.gradientBottom,
              { backgroundColor: colors.background },
            ]}
          />
        </View>
        <View style={styles.content}>
          {type && (
            <View
              style={[styles.typeBadge, { backgroundColor: colors.neonPurple }]}
            >
              <Text style={styles.typeBadgeText}>{type.toUpperCase()}</Text>
            </View>
          )}
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.playButton,
                { backgroundColor: colors.neonPurple },
              ]}
              onPress={onPlay ?? onPress}
              activeOpacity={0.8}
            >
              <Feather name="play" size={16} color="#fff" />
              <Text style={styles.playText}>Regarder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.infoButton,
                { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" },
              ]}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <Feather name="info" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 32,
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 24,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    opacity: 0.85,
  },
  content: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800" as const,
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  playText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  infoButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
