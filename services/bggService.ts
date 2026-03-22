import { BGGGame } from '@/types';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return match?.[1]?.trim() ?? '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`));
  return match?.[1] ?? '';
}

function parseCollection(xml: string): BGGGame[] {
  const games: BGGGame[] = [];
  const itemRegex = /<item[^>]*objectid="(\d+)"[^>]*>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const id = match[1];
    const block = match[2];

    const name = extractTag(block, 'name');
    const thumbnail = extractTag(block, 'thumbnail');
    const minPlayers = parseInt(extractAttr(block, 'stats', 'minplayers') || '0', 10);
    const maxPlayers = parseInt(extractAttr(block, 'stats', 'maxplayers') || '0', 10);

    // Extract average rating from <rating><average value="X.XX"/></rating>
    const ratingBlock = block.match(/<rating[^>]*>([\s\S]*?)<\/rating>/)?.[1] ?? '';
    const avgRating = parseFloat(extractAttr(ratingBlock, 'average', 'value') || '0');

    games.push({
      id,
      name,
      thumbnail: thumbnail || undefined,
      minPlayers,
      maxPlayers,
      avgRating: isNaN(avgRating) ? 0 : Math.round(avgRating * 10) / 10,
    });
  }

  return games.sort((a, b) => b.avgRating - a.avgRating);
}

export async function fetchBGGCollection(username: string): Promise<BGGGame[]> {
  const url = `${BGG_API_BASE}/collection?username=${encodeURIComponent(username)}&own=1&stats=1&subtype=boardgame`;

  // BGG API may return 202 (queued) on first request — retry up to 3 times
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url);

    if (response.status === 200) {
      const xml = await response.text();
      return parseCollection(xml);
    }

    if (response.status === 202) {
      // Collection is being prepared, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }

    if (response.status === 401 || response.status === 404) {
      throw new Error('اسم المستخدم غير موجود في BGG');
    }

    throw new Error(`خطأ من BGG (${response.status})`);
  }

  throw new Error('BGG يستغرق وقتاً طويلاً، حاول لاحقاً');
}

export function filterByPlayerCount(games: BGGGame[], playerCount: number): BGGGame[] {
  return games.filter(
    (g) => g.minPlayers <= playerCount && g.maxPlayers >= playerCount
  );
}
