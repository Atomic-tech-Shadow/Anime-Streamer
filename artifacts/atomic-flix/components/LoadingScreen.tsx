import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  Dimensions,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");

interface LoadingScreenProps {
  label?: string;
  fullscreen?: boolean;
  style?: ViewStyle;
}

// ─── Orbital particle ───────────────────────────────────────────────────────
function OrbitParticle({
  radius,
  size,
  color,
  duration,
  phaseOffset = 0,
  clockwise = true,
}: {
  radius: number;
  size: number;
  color: string;
  duration: number;
  phaseOffset?: number;
  clockwise?: boolean;
}) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delayMs = Math.round(phaseOffset * duration);
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.timing(rot, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }, delayMs);
    return () => clearTimeout(timer);
  }, []);

  const spin = rot.interpolate({
    inputRange: [0, 1],
    outputRange: clockwise ? ["0deg", "360deg"] : ["0deg", "-360deg"],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", transform: [{ rotate: spin }] }]}>
      <View
        style={{
          position: "absolute",
          top: -radius - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          boxShadow: `0 0 ${size * 3}px ${size * 1.5}px ${color}`,
        }}
      />
    </Animated.View>
  );
}

// ─── Spinning ring ───────────────────────────────────────────────────────────
function SpinRing({
  size,
  color,
  borderWidth,
  duration,
  clockwise = true,
  hideBottom = false,
  hideTop = false,
  hideLeft = false,
  hideRight = false,
}: {
  size: number;
  color: string;
  borderWidth: number;
  duration: number;
  clockwise?: boolean;
  hideBottom?: boolean;
  hideTop?: boolean;
  hideLeft?: boolean;
  hideRight?: boolean;
}) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rot.interpolate({
    inputRange: [0, 1],
    outputRange: clockwise ? ["0deg", "360deg"] : ["0deg", "-360deg"],
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          borderColor: color,
          borderBottomColor: hideBottom ? "transparent" : color,
          borderTopColor: hideTop ? "transparent" : color,
          borderLeftColor: hideLeft ? "transparent" : color,
          borderRightColor: hideRight ? "transparent" : color,
          transform: [{ rotate: spin }],
        },
      ]}
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function LoadingScreen({ label, fullscreen = true, style }: LoadingScreenProps) {
  const colors = useColors();

  // Core pulse
  const pulse  = useRef(new Animated.Value(1)).current;
  const glow   = useRef(new Animated.Value(0.5)).current;

  // Brand reveal
  const brandScale   = useRef(new Animated.Value(0.82)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const labelOpacity   = useRef(new Animated.Value(0)).current;

  // Scan bar
  const scanPos = useRef(new Animated.Value(0)).current;

  // Background glow pulse
  const bgGlow1 = useRef(new Animated.Value(0.06)).current;
  const bgGlow2 = useRef(new Animated.Value(0.04)).current;

  useEffect(() => {
    // Core pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.22, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.5, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Background glow breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgGlow1, { toValue: 0.11, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgGlow1, { toValue: 0.06, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgGlow2, { toValue: 0.09, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgGlow2, { toValue: 0.04, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Brand reveal sequence
    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.timing(brandScale, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        Animated.timing(brandOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    if (label) {
      Animated.sequence([
        Animated.delay(1100),
        Animated.timing(labelOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }

    // Scan bar loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanPos, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(200),
        Animated.timing(scanPos, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(200),
      ])
    ).start();
  }, []);

  const BAR_W = Math.min(SCREEN_W - 80, 300);
  const scanTranslate = scanPos.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_W / 2, BAR_W / 2],
  });

  return (
    <View style={[styles.root, fullscreen && styles.fullscreen, { backgroundColor: colors.background }, style]}>

      {/* ── Background glow blobs ─────────────────────────────────── */}
      <Animated.View
        style={[
          styles.bgBlob,
          {
            width: 380,
            height: 380,
            borderRadius: 190,
            backgroundColor: colors.neonPurple,
            top: -120,
            right: -140,
            opacity: bgGlow1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgBlob,
          {
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: colors.neonBlue,
            bottom: 80,
            left: -120,
            opacity: bgGlow2,
          },
        ]}
      />

      {/* ── Orbital system ───────────────────────────────────────────── */}
      <View style={styles.orbitContainer}>

        {/* Rings */}
        <SpinRing size={210} color={colors.neonBlue}   borderWidth={1.5} duration={4000} clockwise hideBottom hideLeft  />
        <SpinRing size={210} color={colors.neonBlue}   borderWidth={0.5} duration={4000} clockwise={false} hideTop hideRight />
        <SpinRing size={158} color={colors.neonPurple} borderWidth={2}   duration={2200} clockwise={false} hideBottom />
        <SpinRing size={108} color={colors.neonPink}   borderWidth={1.5} duration={3100} clockwise hideLeft hideTop />
        <SpinRing size={108} color={colors.neonPink}   borderWidth={0.5} duration={3100} clockwise={false} hideRight hideBottom />
        <SpinRing size={66}  color={colors.neonBlue}   borderWidth={2}   duration={1600} clockwise={false} hideTop />
        <SpinRing size={36}  color={colors.neonPurple} borderWidth={1.5} duration={950}  clockwise hideLeft />

        {/* Orbiting particles */}
        <OrbitParticle radius={100} size={5} color={colors.neonBlue}   duration={3200} phaseOffset={0}    clockwise />
        <OrbitParticle radius={100} size={4} color={colors.neonPurple} duration={3200} phaseOffset={0.33} clockwise />
        <OrbitParticle radius={100} size={3} color={colors.neonPink}   duration={3200} phaseOffset={0.66} clockwise />
        <OrbitParticle radius={74}  size={4} color={colors.neonPurple} duration={2100} phaseOffset={0.2}  clockwise={false} />
        <OrbitParticle radius={74}  size={3} color={colors.neonBlue}   duration={2100} phaseOffset={0.7}  clockwise={false} />
        <OrbitParticle radius={48}  size={4} color={colors.neonPink}   duration={1400} phaseOffset={0.5}  clockwise />

        {/* Glowing core layers */}
        <Animated.View
          style={[
            styles.coreGlow3,
            { backgroundColor: colors.neonPurple, opacity: glow, transform: [{ scale: pulse }] },
          ]}
        />
        <Animated.View
          style={[
            styles.coreGlow2,
            { backgroundColor: colors.neonPurple, opacity: Animated.multiply(glow, 0.6) as any, transform: [{ scale: pulse }] },
          ]}
        />
        <Animated.View
          style={[styles.coreGlow1, { backgroundColor: colors.neonPurple, opacity: glow }]}
        />
        <View style={[styles.coreSolid, { backgroundColor: "#fff" }]} />
      </View>

      {/* ── Brand text ──────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.brandContainer,
          { opacity: brandOpacity, transform: [{ scale: brandScale }] },
        ]}
      >
        <View style={styles.brandRow}>
          <Text style={[styles.brandAtomic, { color: colors.foreground }]}>ATOMIC</Text>
          <Text style={[styles.brandFlix, { color: colors.neonPurple }]}> FLIX</Text>
        </View>

        <Animated.View style={[styles.dividerRow, { opacity: taglineOpacity }]}>
          <View style={[styles.dividerLine, { backgroundColor: colors.neonPurple + "50" }]} />
          <Text style={[styles.tagline, { color: colors.neonBlue }]}>STREAMING SANS LIMITES</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.neonPurple + "50" }]} />
        </Animated.View>
      </Animated.View>

      {/* ── Page label (e.g. "Historique") ──────────────────────────── */}
      {label && label.toLowerCase() !== "atomic flix" && (
        <Animated.Text style={[styles.labelText, { color: colors.mutedForeground, opacity: labelOpacity }]}>
          {label}
        </Animated.Text>
      )}

      {/* ── Credit ───────────────────────────────────────────────────── */}
      <Animated.Text
        style={[
          styles.creditText,
          { color: colors.mutedForeground, opacity: taglineOpacity },
        ]}
      >
        by{" "}
        <Text style={{ color: colors.neonPurple, fontWeight: "700" }}>Shadow</Text>
      </Animated.Text>

      {/* ── Bottom scan bar ──────────────────────────────────────────── */}
      <View style={[styles.scanBarTrack, { width: BAR_W, borderColor: colors.neonPurple + "25" }]}>
        <View style={[styles.scanBarBg, { backgroundColor: colors.neonPurple + "12" }]} />
        <Animated.View
          style={[
            styles.scanBeam,
            {
              backgroundColor: colors.neonBlue,
              shadowColor: colors.neonBlue,
              transform: [{ translateX: scanTranslate }],
            },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const ORBIT = 220;
const CORE3 = 48;
const CORE2 = 28;
const CORE1 = 16;
const CORE0 = 8;

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    gap: 44,
  },
  fullscreen: {
    flex: 1,
  },

  bgBlob: {
    position: "absolute",
  },

  orbitContainer: {
    width: ORBIT,
    height: ORBIT,
    alignItems: "center",
    justifyContent: "center",
  },

  // Core glow layers (largest → smallest)
  coreGlow3: {
    position: "absolute",
    width: CORE3,
    height: CORE3,
    borderRadius: CORE3 / 2,
  },
  coreGlow2: {
    position: "absolute",
    width: CORE2,
    height: CORE2,
    borderRadius: CORE2 / 2,
  },
  coreGlow1: {
    position: "absolute",
    width: CORE1,
    height: CORE1,
    borderRadius: CORE1 / 2,
  },
  coreSolid: {
    width: CORE0,
    height: CORE0,
    borderRadius: CORE0 / 2,
    position: "absolute",
  },

  // Brand
  brandContainer: {
    alignItems: "center",
    gap: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  brandAtomic: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 6,
  },
  brandFlix: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    width: 40,
  },
  tagline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 4,
  },

  labelText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: -20,
  },

  creditText: {
    position: "absolute",
    bottom: 80,
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 1.5,
  },

  // Scan bar
  scanBarTrack: {
    position: "absolute",
    bottom: 52,
    height: 2,
    borderRadius: 1,
    overflow: "hidden",
    borderWidth: 0.5,
  },
  scanBarBg: {
    ...StyleSheet.absoluteFillObject,
  },
  scanBeam: {
    position: "absolute",
    width: 60,
    height: "100%",
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    left: "50%",
    marginLeft: -30,
  },
});
