import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useColors } from "@/hooks/useColors";
import { useEpisodeSources } from "@/hooks/useAnime";

function getSources(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.sources) return data.sources;
  if (data.embeds) return data.embeds;
  if (data.players) return data.players;
  if (data.url) return [{ url: data.url, embed: data.url }];
  return [];
}

export default function PlayerScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();

  const { data, isLoading } = useEpisodeSources(url ?? "");
  const sources = getSources(data);
  const firstSource = sources[0];
  const embedUrl = firstSource?.embed ?? firstSource?.url ?? url ?? "";

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleOpenExternal = () => {
    if (embedUrl) {
      Linking.openURL(embedUrl).catch(() => {});
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {title ?? "Lecture"}
        </Text>
        <TouchableOpacity
          onPress={handleOpenExternal}
          style={styles.externalBtn}
          activeOpacity={0.7}
        >
          <Feather name="external-link" size={20} color={colors.neonBlue} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadState}>
          <Text style={[styles.loadText, { color: colors.mutedForeground }]}>
            Chargement du lecteur...
          </Text>
        </View>
      ) : !embedUrl ? (
        <View style={styles.loadState}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.loadTitle, { color: colors.foreground }]}>
            Lecteur indisponible
          </Text>
          <Text style={[styles.loadText, { color: colors.mutedForeground }]}>
            Impossible de charger la source
          </Text>
        </View>
      ) : Platform.OS === "web" ? (
        <View style={styles.webContainer}>
          <View
            style={[
              styles.webFallback,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="play-circle" size={56} color={colors.neonPurple} />
            <Text style={[styles.webTitle, { color: colors.foreground }]}>
              Lancer l'épisode
            </Text>
            <Text style={[styles.webText, { color: colors.mutedForeground }]}>
              Ouvre le lecteur dans un nouvel onglet
            </Text>
            <TouchableOpacity
              style={[
                styles.openBtn,
                { backgroundColor: colors.neonPurple },
              ]}
              onPress={handleOpenExternal}
              activeOpacity={0.8}
            >
              <Feather name="external-link" size={16} color="#fff" />
              <Text style={styles.openBtnText}>Ouvrir le lecteur</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.loadState,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.loadText, { color: colors.mutedForeground }]}>
                Chargement...
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: "600" as const },
  externalBtn: { padding: 4 },
  webview: { flex: 1 },
  loadState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadTitle: { fontSize: 18, fontWeight: "700" as const },
  loadText: { fontSize: 14, textAlign: "center" },
  webContainer: { flex: 1, padding: 24 },
  webFallback: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 32,
  },
  webTitle: { fontSize: 20, fontWeight: "700" as const },
  webText: { fontSize: 14, textAlign: "center" },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  openBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" as const },
});
