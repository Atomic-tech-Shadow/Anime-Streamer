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

function getTitle(item: any): string {
  return item?.animeTitle ?? item?.title ?? "Anime inconnu";
}

function getImage(item: any): string | undefined {
  return item?.image ?? item?.cover ?? item?.thumbnail ?? item?.img;
}

function getSeason(item: any): number | undefined {
  const s = item?.season ?? item?.saison;
  return s != null ? Number(s) : undefined;
}

function getEpisode(item: any): string | number | undefined {
  return item?.episode ?? item?.episodeNumber ?? item?.ep;
}

function getLanguage(item: any): string | undefined {
  return item?.language ?? item?.lang;
}

function getAnimeId(item: any): string {
  return item?.animeId ?? item?.id ?? item?.url ?? "";
}

function buildEpisodeKey(item: any): string {
  const title = getTitle(item);
  const season = getSeason(item) ?? "";
  const ep     = getEpisode(item) ?? "";
  const lang   = getLanguage(item) ?? "";
  return `${title}::s${season}::e${ep}::${lang}`.toLowerCase();
}

function buildSubtitle(item: any): string {
  const parts: string[] = [];
  const season = getSeason(item);
  const ep     = getEpisode(item);
  const lang   = getLanguage(item);
  if (season != null) parts.push(`Saison ${season}`);
  if (ep      != null) parts.push(`Épisode ${ep}`);
  if (lang)            parts.push(lang);
  return parts.join(" · ");
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
    const arr = Array.from(keys).slice(-500);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

async function buildAttachments(imageUrl: string | undefined): Promise<Notifications.NotificationContentInput["attachments"]> {
  if (!imageUrl || Platform.OS !== "ios") return undefined;
  try {
    return [{ url: imageUrl, thumbnailHidden: false }];
  } catch {
    return undefined;
  }
}

export async function checkAndNotifyNewEpisodes(recentList: any[]): Promise<void> {
  if (!recentList || recentList.length === 0) return;
  if (Platform.OS === "web") return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const seen    = await getSeenKeys();
  const newOnes: any[] = [];

  for (const item of recentList) {
    const key = buildEpisodeKey(item);
    if (key && !seen.has(key)) {
      newOnes.push(item);
      seen.add(key);
    }
  }

  await saveSeenKeys(seen);

  if (newOnes.length === 0) return;

  if (newOnes.length === 1) {
    const item        = newOnes[0];
    const imageUrl    = getImage(item);
    const attachments = await buildAttachments(imageUrl);

    await Notifications.scheduleNotificationAsync({
      content: {
        title:       getTitle(item),
        subtitle:    buildSubtitle(item),
        body:        buildSubtitle(item),
        sound:       true,
        attachments,
        data: {
          animeId: getAnimeId(item),
          season:  getSeason(item),
          episode: getEpisode(item),
          lang:    getLanguage(item),
          image:   imageUrl,
        },
      },
      trigger: null,
    });
  } else {
    const first       = newOnes[0];
    const imageUrl    = getImage(first);
    const attachments = await buildAttachments(imageUrl);

    const names = newOnes.slice(0, 3).map(getTitle);
    const more  = newOnes.length > 3 ? ` et ${newOnes.length - 3} autres` : "";

    await Notifications.scheduleNotificationAsync({
      content: {
        title:       `${newOnes.length} nouveaux épisodes`,
        subtitle:    names.join(", ") + more,
        body:        names.join(", ") + more,
        sound:       true,
        attachments,
        data:        { batch: true },
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
