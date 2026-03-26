import AsyncStorage from '@react-native-async-storage/async-storage';
import { BGGGame } from '@/types';
import { getSupabaseClient } from '@/template';

const BGG_USERNAME_KEY = '@nard_bgg_username';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// --- Username persistence (still using AsyncStorage) ---

export async function saveBGGUsername(username: string): Promise<void> {
  await AsyncStorage.setItem(BGG_USERNAME_KEY, username.trim());
}

export async function loadBGGUsername(): Promise<string | null> {
  return AsyncStorage.getItem(BGG_USERNAME_KEY);
}

// --- Collection persistence (now using Supabase database) ---

export async function saveBGGCollection(games: BGGGame[]): Promise<number> {
  if (!Array.isArray(games) || games.length === 0) {
    throw new Error('البيانات غير صالحة');
  }
  const first = games[0];
  if (!first.id || !first.name) {
    throw new Error('صيغة البيانات غير صحيحة');
  }

  const supabase = getSupabaseClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  // Delete existing games for this user
  const { error: deleteError } = await supabase
    .from('user_bgg_games')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    throw new Error('فشل حذف الألعاب القديمة');
  }

  // Insert new games
  const gamesToInsert = games.map(game => ({
    user_id: user.id,
    bgg_game_id: game.id,
    name: game.name,
    thumbnail: game.thumbnail,
    image: game.image,
    year_published: game.yearPublished,
    min_players: game.minPlayers,
    max_players: game.maxPlayers,
    playing_time: game.playingTime,
    rating: game.rating,
  }));

  const { error: insertError } = await supabase
    .from('user_bgg_games')
    .insert(gamesToInsert);

  if (insertError) {
    throw new Error('فشل حفظ الألعاب');
  }

  return games.length;
}

export async function loadBGGCollection(): Promise<BGGGame[]> {
  const supabase = getSupabaseClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return [];
  }

  // Load games from database
  const { data, error } = await supabase
    .from('user_bgg_games')
    .select('*')
    .eq('user_id', user.id)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error loading BGG games:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Convert database format to BGGGame format
  return data.map(game => ({
    id: game.bgg_game_id,
    name: game.name,
    thumbnail: game.thumbnail || undefined,
    image: game.image || undefined,
    yearPublished: game.year_published || undefined,
    minPlayers: game.min_players,
    maxPlayers: game.max_players,
    playingTime: game.playing_time || undefined,
    rating: game.rating || 0,
  }));
}

export async function clearBGGCollection(): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  // Delete all games for this user
  const { error } = await supabase
    .from('user_bgg_games')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    throw new Error('فشل حذف الألعاب');
  }
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
