import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseXMLToGames(xml: string) {
  if (xml.includes("<errors>")) {
    const msgMatch = xml.match(/<message>([^<]*)<\/message>/);
    throw new Error(msgMatch ? msgMatch[1] : "BGG error");
  }

  const games: any[] = [];
  const itemRegex = /<item[^>]*objectid="(\d+)"[^>]*>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const id = match[1];
    const block = match[2];

    const nameMatch = block.match(/<name[^>]*>([^<]*)<\/name>/);
    const name = nameMatch ? nameMatch[1].trim() : "?";

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
    const playingTime = playingTimeMatch
      ? parseInt(playingTimeMatch[1])
      : undefined;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return new Response(
        JSON.stringify({ error: "username parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bggToken = Deno.env.get("BGG_API_TOKEN");
    if (!bggToken) {
      return new Response(
        JSON.stringify({ error: "BGG_API_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bggUrl = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&stats=1&subtype=boardgame`;

    for (let attempt = 1; attempt <= 6; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(bggUrl, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${bggToken}`,
          },
        });
        clearTimeout(timeout);

        if (response.status === 200) {
          const xml = await response.text();
          const games = parseXMLToGames(xml);
          return new Response(JSON.stringify(games), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (response.status === 202) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }

        if (response.status === 404) {
          return new Response(
            JSON.stringify({ error: "اسم المستخدم غير موجود في BGG" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: `BGG returned ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        clearTimeout(timeout);
        if (attempt === 6) {
          return new Response(
            JSON.stringify({ error: "فشل الاتصال بـ BGG بعد 6 محاولات" }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    return new Response(
      JSON.stringify({ error: "فشل الاتصال بـ BGG" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
