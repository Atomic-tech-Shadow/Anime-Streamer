import React, { useRef, useEffect } from "react";
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

  // ── Press scale ──
  const pressScale = useRef(new Animated.Value(1)).current;
  const handlePressIn  = () => Animated.spring(pressScale, { toValue: 0.975, useNativeDriver: true, tension: 120, friction: 8 }).start();
  const handlePressOut = () => Animated.spring(pressScale, { toValue: 1,     useNativeDriver: true, tension: 120, friction: 8 }).start();

  // ── Ken Burns: image zooms 1 → 1.08 → 1 in loop ──
  const kenBurns = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let stopped = false;
    const loop = () => {
      if (stopped) return;
      Animated.sequence([
        Animated.timing(kenBurns, { toValue: 1.08, duration: 9000, useNativeDriver: true }),
        Animated.timing(kenBurns, { toValue: 1,    duration: 9000, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) loop(); });
    };
    loop();
    return () => { stopped = true; };
  }, []);

  // ── Staggered entrance: reset & replay on each new title ──
  const badgeOpacity    = useRef(new Animated.Value(0)).current;
  const badgeY          = useRef(new Animated.Value(18)).current;
  const titleOpacity    = useRef(new Animated.Value(0)).current;
  const titleY          = useRef(new Animated.Value(18)).current;
  const actionsOpacity  = useRef(new Animated.Value(0)).current;
  const actionsY        = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    badgeOpacity.setValue(0);   badgeY.setValue(18);
    titleOpacity.setValue(0);   titleY.setValue(18);
    actionsOpacity.setValue(0); actionsY.setValue(18);

    const makeIn = (opacity: Animated.Value, y: Animated.Value) =>
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(y,       { toValue: 0, useNativeDriver: true, tension: 100, friction: 12 }),
      ]);

    Animated.stagger(140, [
      makeIn(badgeOpacity, badgeY),
      makeIn(titleOpacity, titleY),
      makeIn(actionsOpacity, actionsY),
    ]).start();
  }, [title]);

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale: pressScale }] }]}>

        {/* Ken Burns image */}
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: kenBurns }] }]}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={500}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          )}
        </Animated.View>

        {/* Cinematic gradient */}
        <LinearGradient
          colors={["rgba(8,8,15,0.05)", "rgba(8,8,15,0.42)", "rgba(8,8,15,0.97)"]}
          locations={[0, 0.38, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Staggered content */}
        <View style={styles.content}>

          {/* Badge */}
          {type && (
            <Animated.View style={{ opacity: badgeOpacity, transform: [{ translateY: badgeY }] }}>
              <View style={[styles.typeBadge, { backgroundColor: colors.neonPurple + "30", borderColor: colors.neonPurple + "55" }]}>
                <View style={[styles.typeDot, { backgroundColor: colors.neonPurple }]} />
                <Text style={[styles.typeBadgeText, { color: colors.neonPurple }]}>{type.toUpperCase()}</Text>
              </View>
            </Animated.View>
          )}

          {/* Title */}
          <Animated.Text
            style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
            numberOfLines={2}
          >
            {title}
          </Animated.Text>

          {/* Buttons */}
          <Animated.View style={[styles.actions, { opacity: actionsOpacity, transform: [{ translateY: actionsY }] }]}>
            <TouchableOpacity onPress={onPlay ?? onPress} activeOpacity={0.82} style={styles.playWrap}>
              <LinearGradient
                colors={[colors.neonPurple, colors.neonBlue]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.playButton, {
                  shadowColor: colors.neonPurple,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.55,
                  shadowRadius: 12,
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
          </Animated.View>

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
