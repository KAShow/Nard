import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: 'OnSpace AI غير مُفعّل' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a funny Arabic title for a board game session
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'أنت خبير في إنشاء عناوين مضحكة وإبداعية باللغة العربية لجلسات ألعاب اللوحة (Board Games). العناوين يجب أن تكون قصيرة جداً (1-3 كلمات فقط) ومليئة بالدعابة والمبالغة الكوميدية. استخدم أسلوب المزاح بين الأصدقاء والمبالغات الدرامية.'
          },
          {
            role: 'user',
            content: 'اقترح عنوان واحد فقط مضحك جداً لجلسة ألعاب لوحة. يجب أن يكون العنوان قصير جداً (3 كلمات كحد أقصى) ومباشر، بدون نقاط أو رموز إضافية. فقط النص العربي المضحك.'
          }
        ],
        max_tokens: 50,
        temperature: 1.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OnSpace AI error:', errorText);
      return new Response(
        JSON.stringify({ error: 'فشل توليد العنوان' }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim() ?? '';

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'لم يتم توليد عنوان' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up any unwanted characters
    const cleanTitle = title
      .replace(/["'`]/g, '')
      .replace(/^[-•\s]+/, '')
      .trim();

    return new Response(
      JSON.stringify({ title: cleanTitle }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
