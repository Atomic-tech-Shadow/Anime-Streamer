import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const STORAGE_KEY = "atomic_flix_seen_episodes";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function buildEpisodeKey(item: any): string {
  const title = item?.animeTitle ?? item?.title ?? "";
  const ep    = item?.episode ?? item?.episodeNumber ?? item?.ep ?? "";
  const lang  = item?.language ?? item?.lang ?? "";
  return `${title}::${ep}::${lang}`.toLowerCase();
}

function buildEpisodeTitle(item: any): string {
  return item?.animeTitle ?? item?.title ?? "Anime inconnu";
}

function buildEpisodeBody(item: any): string {
  const ep   = item?.episode ?? item?.episodeNumber ?? item?.ep;
  const lang = item?.language ?? item?.lang;
  const parts: string[] = [];
  if (ep   != null) parts.push(`Épisode ${ep}`);
  if (lang)         parts.push(lang);
  return parts.join(" · ") || "Nouvel épisode disponible";
}

async function getSeenKeys(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function saveSeenKeys(keys: Set<string>): Promise<void> {
  try {
    const arr = Array.from(keys).slice(-300);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

export async function checkAndNotifyNewEpisodes(recentList: any[]): Promise<void> {
  if (!recentList || recentList.length === 0) return;
  if (Platform.OS === "web") return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const seen   = await getSeenKeys();
  const newOnes: any[] = [];

  for (const item of recentList) {
    const key = buildEpisodeKey(item);
    if (key && !seen.has(key)) {
      newOnes.push(item);
      seen.add(key);
    }
  }

  if (newOnes.length === 0) {
    await saveSeenKeys(seen);
    return;
  }

  await saveSeenKeys(seen);

  if (newOnes.length === 1) {
    const item = newOnes[0];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: buildEpisodeTitle(item),
        body:  buildEpisodeBody(item),
        sound: true,
        data:  { animeId: item?.animeId ?? item?.id ?? "" },
      },
      trigger: null,
    });
  } else {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${newOnes.length} nouveaux épisodes`,
        body:  newOnes.slice(0, 3).map(buildEpisodeTitle).join(", ") +
               (newOnes.length > 3 ? ` et ${newOnes.length - 3} autres…` : ""),
        sound: true,
        data:  { batch: true },
      },
      trigger: null,
    });
  }
}

export async function clearSeenEpisodes(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}
