import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface EpisodeItemProps {
  number?: number;
  title?: string;
  thumbnail?: string;
  onPress?: () => void;
  isSelected?: boolean;
}

export default function EpisodeItem({
  number,
  title,
  thumbnail,
  onPress,
  isSelected,
}: EpisodeItemProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? colors.secondary : colors.card,
          borderColor: isSelected ? colors.neonPurple : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.thumbnail,
          { backgroundColor: colors.secondary },
        ]}
      >
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : null}
        <View
          style={[
            styles.playOverlay,
            { backgroundColor: isSelected ? colors.neonPurple : "rgba(0,0,0,0.5)" },
          ]}
        >
          <Feather name="play" size={16} color="#fff" />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.epNumber, { color: colors.mutedForeground }]}>
          Épisode {number}
        </Text>
        {title && (
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </View>
      {isSelected && (
        <Feather name="check-circle" size={18} color={colors.neonPurple} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    padding: 4,
  },
  thumbnail: {
    width: 88,
    height: 52,
    borderRadius: 7,
    overflow: "hidden",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
  },
  epNumber: {
    fontSize: 11,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
});
