import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SpinnerLoaderProps {
  size?: number;
  style?: ViewStyle;
  fullscreen?: boolean;
}

export default function SpinnerLoader({ size = 48, style, fullscreen = false }: SpinnerLoaderProps) {
  const colors = useColors();

  const outerRot = useRef(new Animated.Value(0)).current;
  const innerRot = useRef(new Animated.Value(0)).current;
  const pulse    = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(outerRot, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(innerRot, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spinOuter = outerRot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const spinInner = innerRot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });

  const outerSize = size;
  const innerSize = size * 0.62;
  const dotSize   = size * 0.18;
  const coreSize  = size * 0.22;

  return (
    <View style={[fullscreen && styles.fullscreen, { alignItems: "center", justifyContent: "center" }, style]}>
      <View style={{ width: outerSize, height: outerSize, alignItems: "center", justifyContent: "center" }}>

        {/* Outer ring */}
        <Animated.View
          style={{
            position: "absolute",
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderWidth: size * 0.055,
            borderColor: colors.neonPurple,
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            transform: [{ rotate: spinOuter }],
            boxShadow: `0 0 ${size * 0.25}px ${size * 0.08}px ${colors.neonPurple}`,
          }}
        />

        {/* Inner ring */}
        <Animated.View
          style={{
            position: "absolute",
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            borderWidth: size * 0.045,
            borderColor: colors.neonBlue,
            borderTopColor: "transparent",
            borderRightColor: "transparent",
            transform: [{ rotate: spinInner }],
            boxShadow: `0 0 ${size * 0.2}px ${size * 0.06}px ${colors.neonBlue}`,
          }}
        />

        {/* Orbiting dot on outer ring */}
        <Animated.View
          style={{
            position: "absolute",
            width: outerSize,
            height: outerSize,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: spinOuter }],
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: colors.neonPurple,
              boxShadow: `0 0 ${dotSize * 2}px ${dotSize}px ${colors.neonPurple}`,
            }}
          />
        </Animated.View>

        {/* Glowing core */}
        <Animated.View
          style={{
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
            backgroundColor: colors.neonPurple,
            opacity: pulse,
            boxShadow: `0 0 ${coreSize * 1.5}px ${coreSize * 0.8}px ${colors.neonPurple}`,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
});
