import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SkeletonCardProps {
  width?: number;
  height?: number;
}

export default function SkeletonCard({
  width = 140,
  height = 198,
}: SkeletonCardProps) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          width,
          height,
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
  },
});
