import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  accent?: boolean;
}

export default function SectionHeader({
  title,
  onSeeAll,
  accent,
}: SectionHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {accent && (
          <View
            style={[styles.accent, { backgroundColor: colors.neonPurple }]}
          />
        )}
        <Text style={[styles.title, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={[styles.seeAll, { color: colors.neonBlue }]}>
            Voir tout
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
});
