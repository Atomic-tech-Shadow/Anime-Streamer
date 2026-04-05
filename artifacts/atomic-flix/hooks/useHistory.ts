import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  animeId: string;
  title: string;
  image: string;
  season: string;
  seasonLabel?: string;
  seasonName?: string;
  seasonType?: string;
  episodeNum: string;
  language: string;
  availableLanguages: string;
  watchedAt: number;
}

const STORAGE_KEY = "@atomic_flix_history";
const MAX_ENTRIES = 100;

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setHistory(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((entries: HistoryEntry[]) => {
    setHistory(entries);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});
  }, []);

  const addToHistory = useCallback((entry: Omit<HistoryEntry, "id" | "watchedAt">) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.animeId === entry.animeId && h.season === entry.season && h.episodeNum === entry.episodeNum && h.language === entry.language)
      );
      const newEntry: HistoryEntry = {
        ...entry,
        id: `${entry.animeId}-${entry.season}-${entry.episodeNum}-${entry.language}`,
        watchedAt: Date.now(),
      };
      const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    persist([]);
  }, [persist]);

  return { history, loaded, addToHistory, removeFromHistory, clearHistory };
}
