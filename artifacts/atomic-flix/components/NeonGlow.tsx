import React from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface NeonGlowProps {
  color?: string;
  size?: number;
  style?: object;
}

export default function NeonGlow({ color, size = 200, style }: NeonGlowProps) {
  const colors = useColors();
  const glowColor = color ?? colors.neonPurple;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: glowColor,
          opacity: 0.08,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
  },
});
