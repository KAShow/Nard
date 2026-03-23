import AsyncStorage from '@react-native-async-storage/async-storage';
import { BGGGame } from '@/types';

const BGG_COLLECTION_KEY = '@nard_bgg_collection';

export async function saveBGGCollection(jsonString: string): Promise<number> {
  const games: BGGGame[] = JSON.parse(jsonString);
  if (!Array.isArray(games) || games.length === 0) {
    throw new Error('البيانات غير صالحة');
  }
  // Validate first item has required fields
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
