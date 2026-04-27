import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — глубоко эмпатичный литературный собеседник, знаток мировой поэзии, литературы и кино. Твоя задача — находить отрывки из стихов, прозы и киномонологов, которые точно резонируют с эмоциональным состоянием человека.

ПРИНЦИПЫ:
- Подбирай 6–8 произведений, которые глубоко и искренне отзываются с описанным состоянием.
- Приоритет — реальным авторам: Цветаева, Ахматова, Есенин, Бродский, Пушкин, Пастернак, Мандельштам, Тарковский, Рильке, Неруда, Дикинсон, Уитмен, Хайям, Руми, Басё, Бунин, Блок, и др.
- Можно включать прозу (Достоевский, Чехов, Камю, Сент-Экзюпери, Хемингуэй, Маркес, Мураками) и культовые киноцитаты (Тарковский, Бергман, Малик, Кесьлёвский).
- Баланс: что-то утешающее, что-то признающее боль, что-то с тихим лучом надежды или преображения.
- Если не находишь идеального реального соответствия — можешь создать оригинальный отрывок «в духе» автора, и в поле author указать «По мотивам [Имя]» или «Оригинал, в духе [эпохи/автора]».
- Текст отрывка — точный, не сокращай ради краткости. 8–20 строк для стихов, 2–6 предложений для прозы/кино.
- Объяснение (explanation) — тёплое, личное, 1–2 предложения о том, почему именно это отзывается.
- relevance_score — от 70 до 99.
- ВСЕГДА отвечай на русском.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input_text, emotions = [], intensity, context } = await req.json();

    if (!input_text || typeof input_text !== "string" || input_text.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Опишите чувство подробнее" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Состояние пользователя: "${input_text}"
Выбранные эмоции: ${emotions.length ? emotions.join(", ") : "не указаны"}
Интенсивность: ${intensity ?? "не указана"} / 10
Контекст: ${context || "не указан"}

Подбери 6–8 резонансных произведений.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_resonant_pieces",
            description: "Возвращает список резонансных литературных и кинопроизведений",
            parameters: {
              type: "object",
              properties: {
                pieces: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Название произведения" },
                      author: { type: "string", description: "Автор (или 'По мотивам ...')" },
                      year: { type: "string", description: "Год, если известен" },
                      source_type: { type: "string", enum: ["poem", "book", "film", "quote"] },
                      text: { type: "string", description: "Точный текст отрывка" },
                      explanation: { type: "string", description: "Тёплое 1-2 предложения, почему отзывается" },
                      relevance_score: { type: "number", description: "70-99" },
                      is_original: { type: "boolean", description: "true если это AI-стилизация" },
                    },
                    required: ["title", "author", "source_type", "text", "explanation", "relevance_score"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["pieces"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_resonant_pieces" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Попробуйте через минуту." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Нужно пополнить кредиты Lovable AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI недоступен" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Не удалось получить отклик" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ pieces: args.pieces || [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("find-resonance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
