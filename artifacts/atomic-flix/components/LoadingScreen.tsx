import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface LoadingScreenProps {
  label?: string;
  fullscreen?: boolean;
  style?: ViewStyle;
}

export default function LoadingScreen({
  label,
  fullscreen = true,
  style,
}: LoadingScreenProps) {
  const colors = useColors();

  const ring1Rot  = useRef(new Animated.Value(0)).current;
  const ring2Rot  = useRef(new Animated.Value(0)).current;
  const ring3Rot  = useRef(new Animated.Value(0)).current;
  const pulse     = useRef(new Animated.Value(1)).current;
  const glow      = useRef(new Animated.Value(0.4)).current;
  const labelFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(ring1Rot, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(ring2Rot, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(ring3Rot, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.18,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(labelFade, {
      toValue: 1,
      duration: 600,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const spin1 = ring1Rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const spin2 = ring2Rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });
  const spin3 = ring3Rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[
        styles.container,
        fullscreen && styles.fullscreen,
        { backgroundColor: colors.background },
        style,
      ]}
    >
      {/* Outer slow ring — neon blue dashed-like */}
      <Animated.View
        style={[
          styles.ring,
          styles.ring1,
          {
            borderColor: colors.neonBlue,
            transform: [{ rotate: spin1 }],
          },
        ]}
      />

      {/* Middle fast ring — neon purple */}
      <Animated.View
        style={[
          styles.ring,
          styles.ring2,
          {
            borderColor: colors.neonPurple,
            transform: [{ rotate: spin2 }],
          },
        ]}
      />

      {/* Inner slow ring — neon pink */}
      <Animated.View
        style={[
          styles.ring,
          styles.ring3,
          {
            borderColor: colors.neonPink,
            transform: [{ rotate: spin3 }],
          },
        ]}
      />

      {/* Glowing core */}
      <Animated.View
        style={[
          styles.core,
          {
            backgroundColor: colors.neonPurple,
            opacity: glow,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      {/* Inner core solid */}
      <View
        style={[
          styles.coreInner,
          { backgroundColor: colors.neonPurple },
        ]}
      />

      {/* Label */}
      {label && (
        <Animated.Text
          style={[
            styles.label,
            { color: colors.mutedForeground, opacity: labelFade },
          ]}
        >
          {label}
        </Animated.Text>
      )}
    </View>
  );
}

const RING1 = 80;
const RING2 = 56;
const RING3 = 36;
const CORE  = 18;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreen: {
    flex: 1,
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 999,
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
  },
  ring1: {
    width: RING1,
    height: RING1,
    borderWidth: 2.5,
    borderRightColor: "transparent",
  },
  ring2: {
    width: RING2,
    height: RING2,
    borderWidth: 2,
    borderBottomColor: "transparent",
  },
  ring3: {
    width: RING3,
    height: RING3,
    borderWidth: 1.5,
    borderRightColor: "transparent",
  },
  core: {
    position: "absolute",
    width: CORE + 10,
    height: CORE + 10,
    borderRadius: 999,
  },
  coreInner: {
    width: CORE,
    height: CORE,
    borderRadius: 999,
    position: "absolute",
  },
  label: {
    position: "absolute",
    bottom: "35%",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
