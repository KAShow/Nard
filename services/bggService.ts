import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BGGGame } from '@/types';

const BGG_COLLECTION_KEY = '@nard_bgg_collection';
const BGG_USERNAME_KEY = '@nard_bgg_username';

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

// --- BGG API fetch ---

function getBGGApiUrl(username: string): string {
  const bggUrl = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&stats=1&subtype=boardgame`;
  if (Platform.OS === 'web') {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(bggUrl)}`;
  }
  return bggUrl;
}

function parseXMLToGames(xml: string): BGGGame[] {
  // Check for error response
  if (xml.includes('<errors>')) {
    const msgMatch = xml.match(/<message>([^<]*)<\/message>/);
    throw new Error(msgMatch ? msgMatch[1] : 'خطأ من BGG');
  }

  const games: BGGGame[] = [];
  const itemRegex = /<item[^>]*objectid="(\d+)"[^>]*>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const id = match[1];
    const block = match[2];

    const nameMatch = block.match(/<name[^>]*>([^<]*)<\/name>/);
    const name = nameMatch ? nameMatch[1].trim() : '?';

    const yearMatch = block.match(/<yearpublished>([^<]*)<\/yearpublished>/);
    const yearPublished = yearMatch ? yearMatch[1].trim() : undefined;

    const imageMatch = block.match(/<image>([^<]*)<\/image>/);
    const image = imageMatch ? imageMatch[1].trim() : undefined;

    const thumbMatch = block.match(/<thumbnail>([^<]*)<\/thumbnail>/);
    const thumbnail = thumbMatch ? thumbMatch[1].trim() : undefined;

    const minPlayersMatch = block.match(/<stats[^>]*\sminplayers="(\d+)"/);
    const maxPlayersMatch = block.match(/<stats[^>]*\smaxplayers="(\d+)"/);
    const minPlayers = minPlayersMatch ? parseInt(minPlayersMatch[1]) : 0;
    const maxPlayers = maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : 0;

    const playingTimeMatch = block.match(/<stats[^>]*\splayingtime="(\d+)"/);
    const playingTime = playingTimeMatch ? parseInt(playingTimeMatch[1]) : undefined;

    const avgMatch = block.match(/<average\s+value="([^"]*)"/);
    const rating = avgMatch ? parseFloat(avgMatch[1]) : 0;

    games.push({
      id,
      name,
      yearPublished,
      image,
      thumbnail,
      minPlayers,
      maxPlayers,
      playingTime,
      rating: isNaN(rating) ? 0 : Math.round(rating * 10) / 10,
    });
  }

  return games.sort((a, b) => b.rating - a.rating);
}

export async function fetchBGGCollection(
  username: string,
  onStatus?: (message: string) => void,
): Promise<BGGGame[]> {
  const url = getBGGApiUrl(username);

  for (let attempt = 1; attempt <= 6; attempt++) {
    onStatus?.(`محاولة ${attempt} من 6...`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.status === 200) {
        const xml = await response.text();
        const games = parseXMLToGames(xml);
        if (games.length === 0) {
          throw new Error('لم يتم العثور على ألعاب في مجموعتك');
        }
        return games;
      }

      if (response.status === 202) {
        onStatus?.('جاري تجهيز المجموعة...');
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      if (response.status === 404) {
        throw new Error('اسم المستخدم غير موجود في BGG');
      }

      throw new Error(`خطأ من BGG: ${response.status}`);
    } catch (e: any) {
      if (e.message && !e.message.startsWith('محاولة') && e.name !== 'AbortError') {
        // Re-throw known errors (not network/timeout errors)
        if (
          e.message.includes('غير موجود') ||
          e.message.includes('لم يتم') ||
          e.message.includes('خطأ من BGG')
        ) {
          throw e;
        }
      }
      if (attempt < 6) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  throw new Error('فشل الاتصال بـ BGG، حاول مرة أخرى لاحقاً');
}
