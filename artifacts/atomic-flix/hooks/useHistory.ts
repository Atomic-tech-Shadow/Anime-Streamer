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

  const reload = useCallback(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        setHistory(raw ? JSON.parse(raw) : []);
      })
      .catch(() => setHistory([]))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    reload();
  }, []);

  const addToHistory = useCallback((entry: Omit<HistoryEntry, "id" | "watchedAt">) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `${entry.animeId}-${entry.season}-${entry.episodeNum}-${entry.language}`,
      watchedAt: Date.now(),
    };
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      const prev: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      const filtered = prev.filter(
        (h) => h.id !== newEntry.id
      );
      const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
    }).catch(() => {});
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([])).catch(() => {});
  }, []);

  return { history, loaded, reload, addToHistory, removeFromHistory, clearHistory };
}
