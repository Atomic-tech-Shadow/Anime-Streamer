import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSearch } from "@/hooks/useAnime";
import AnimeCard from "@/components/AnimeCard";
import SearchBar from "@/components/SearchBar";
import SpinnerLoader from "@/components/SpinnerLoader";


function getAnimeList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.animes) return data.animes;
  if (data.results) return data.results;
  if (data.anime) return data.anime;
  if (data.data) return Array.isArray(data.data) ? data.data : [];
  return [];
}

function getAnimeId(item: any): string {
  return item?.id ?? item?.url ?? item?.title ?? "";
}

function getAnimeImage(item: any): string | undefined {
  return item?.image ?? item?.cover ?? item?.thumbnail ?? item?.img;
}

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const { data, isLoading } = useSearch(query);
  const results = getAnimeList(data);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
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
        <View style={{ flex: 1 }}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery("")}
            autoFocus
          />
        </View>
      </View>

      {query.trim().length < 2 ? (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Rechercher un anime
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tapez le nom d'un anime pour le trouver
          </Text>
        </View>
      ) : isLoading ? (
        <SpinnerLoader fullscreen />
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="frown" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Aucun résultat
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Essaie un autre titre
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={3}
          keyExtractor={(item, i) => getAnimeId(item) || String(i)}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 },
          ]}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <AnimeCard
                title={item.title}
                image={getAnimeImage(item)}
                type={item.type}
                size="small"
                onPress={() => {
                  const id = getAnimeId(item);
                  if (id) {
                    router.push({
                      pathname: "/anime/[id]",
                      params: {
                        id,
                        title: item.title ?? "",
                        image: getAnimeImage(item) ?? "",
                      },
                    });
                  }
                }}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridItem: {
    flex: 1 / 3,
    alignItems: "center",
    marginBottom: 4,
  },
});
