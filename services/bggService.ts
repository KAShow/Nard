import AsyncStorage from '@react-native-async-storage/async-storage';
import { BGGGame } from '@/types';

const BGG_COLLECTION_KEY = '@nard_bgg_collection';
const BGG_USERNAME_KEY = '@nard_bgg_username';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// --- Username persistence ---

export async function saveBGGUsername(username: string): Promise<void> {
  await AsyncStorage.setItem(BGG_USERNAME_KEY, username.trim());
}

export async function loadBGGUsername(): Promise<string | null> {
  return AsyncStorage.getItem(BGG_USERNAME_KEY);
}

// --- Collection persistence ---

export async function saveBGGCollection(games: BGGGame[]): Promise<number> {
  if (!Array.isArray(games) || games.length === 0) {
    throw new Error('البيانات غير صالحة');
  }
  const first = games[0];
  if (!first.id || !first.name) {
    throw new Error('صيغة البيانات غير صحيحة');
  }
  await AsyncStorage.setItem(BGG_COLLECTION_KEY, JSON.stringify(games));
  return games.length;
}

export async function loadBGGCollection(): Promise<BGGGame[]> {
  const data = await AsyncStorage.getItem(BGG_COLLECTION_KEY);
  if (!data) return [];
  return JSON.parse(data) as BGGGame[];
}

export async function clearBGGCollection(): Promise<void> {
  await AsyncStorage.removeItem(BGG_COLLECTION_KEY);
}

export function filterByPlayerCount(games: BGGGame[], playerCount: number): BGGGame[] {
  return games.filter(
    (g) => g.minPlayers <= playerCount && g.maxPlayers >= playerCount
  );
}

// --- BGG API fetch via Edge Function ---

export async function fetchBGGCollection(
  username: string,
  onStatus?: (message: string) => void,
): Promise<BGGGame[]> {
  onStatus?.('جاري الاتصال...');

  const url = `${SUPABASE_URL}/functions/v1/bgg-collection?username=${encodeURIComponent(username)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error || `خطأ: ${response.status}`;
    throw new Error(message);
  }

  const games: BGGGame[] = await response.json();

  if (!games || games.length === 0) {
    throw new Error('لم يتم العثور على ألعاب في مجموعتك');
  }

  onStatus?.(`تم جلب ${games.length} لعبة`);
  return games;
}
