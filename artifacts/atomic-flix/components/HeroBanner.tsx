import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HeroBannerProps {
  title: string;
  image?: string;
  type?: string;
  onPress?: () => void;
  onPlay?: () => void;
}

export default function HeroBanner({ title, image, type, onPress, onPlay }: HeroBannerProps) {
  const colors = useColors();
  const scale  = useRef(new Animated.Value(1)).current;

  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, tension: 120, friction: 8 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, tension: 120, friction: 8 }).start();

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>

        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={400}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
        )}

        <LinearGradient
          colors={["rgba(8,8,15,0.08)", "rgba(8,8,15,0.45)", "rgba(8,8,15,0.96)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {type && (
            <View style={[styles.typeBadge, { backgroundColor: colors.neonPurple + "30", borderColor: colors.neonPurple + "55" }]}>
              <View style={[styles.typeDot, { backgroundColor: colors.neonPurple }]} />
              <Text style={[styles.typeBadgeText, { color: colors.neonPurple }]}>{type.toUpperCase()}</Text>
            </View>
          )}

          <Text style={styles.title} numberOfLines={2}>{title}</Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onPlay ?? onPress} activeOpacity={0.82} style={styles.playWrap}>
              <LinearGradient
                colors={[colors.neonPurple, colors.neonBlue]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.playButton, {
                  shadowColor: colors.neonPurple,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                  elevation: 8,
                }]}
              >
                <Feather name="play" size={14} color="#fff" />
                <Text style={styles.playText}>Regarder</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.infoButton, { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.22)" }]}
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
    height: 228,
    borderRadius: 18,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  content: { position: "absolute", bottom: 18, left: 16, right: 16 },

  typeBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, marginBottom: 10,
  },
  typeDot: { width: 5, height: 5, borderRadius: 3 },
  typeBadgeText: { fontSize: 9, fontWeight: "800" as const, letterSpacing: 1.2 },

  title: {
    color: "#fff", fontSize: 22, fontWeight: "800" as const,
    letterSpacing: -0.5, lineHeight: 27, marginBottom: 14,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },

  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  playWrap: {},
  playButton: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10,
  },
  playText: { color: "#fff", fontSize: 14, fontWeight: "700" as const },

  infoButton: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
});
