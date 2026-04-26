// Date Roulette — generates a spontaneous, balanced date experience.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  budget: number;
  mood?: string;
  city?: string;
  area?: string;
  preferences?: string[];
}

const TOOL = {
  type: "function",
  function: {
    name: "spin_roulette",
    description: "Generate a random but balanced Date Roulette experience.",
    parameters: {
      type: "object",
      properties: {
        roulette: {
          type: "object",
          properties: {
            activity: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                estimatedCost: { type: "number" },
                emoji: { type: "string" },
              },
              required: ["title", "description", "estimatedCost", "emoji"],
              additionalProperties: false,
            },
            food: {
              type: "object",
              properties: {
                type: { type: "string" },
                suggestion: { type: "string" },
                estimatedCost: { type: "number" },
                emoji: { type: "string" },
              },
              required: ["type", "suggestion", "estimatedCost", "emoji"],
              additionalProperties: false,
            },
            challenge: {
              type: "object",
              properties: {
                title: { type: "string" },
                instruction: { type: "string" },
                funLevel: { type: "string", enum: ["low", "medium", "high"] },
                emoji: { type: "string" },
              },
              required: ["title", "instruction", "funLevel", "emoji"],
              additionalProperties: false,
            },
          },
          required: ["activity", "food", "challenge"],
          additionalProperties: false,
        },
        totalEstimatedCost: { type: "number" },
        vibe: { type: "string", description: "Short vibe like 'playful and spontaneous'." },
        assistantNote: { type: "string", description: "One playful line, can include emojis." },
      },
      required: ["roulette", "totalEstimatedCost", "vibe", "assistantNote"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const p = (await req.json()) as Payload;
    if (!p?.budget || p.budget < 100) {
      return new Response(JSON.stringify({ error: "Provide a budget (≥ ₹100)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = [
      `Budget cap: ₹${p.budget} (activity + food combined)`,
      `Mood: ${p.mood || "fun"}`,
      p.city || p.area ? `Location: ${[p.area, p.city].filter(Boolean).join(", ")}` : "",
      p.preferences?.length ? `Preferences: ${p.preferences.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are DateCraft's playful Date Roulette spinner. Generate a SPONTANEOUS, balanced date experience for an Indian city couple.

RULES:
- Mix comfort + novelty (familiar food + surprising activity, or vice versa)
- Activity + food cost MUST total ≤ budget cap (in INR)
- Use REAL venue types/areas if a city is given (e.g. "Cubbon Park", "VV Puram food street")
- Surprise challenge encourages connection — NOT awkwardness or unsafe behavior
- Vary outputs: each spin should feel different (rotate between cuisines, indoor/outdoor, etc.)
- Keep tone warm, playful, slightly unpredictable

CHALLENGE EXAMPLES (use as inspiration, invent your own):
- "Buy each other a ₹50 mystery gift"
- "Ask 3 unexpected questions"
- "Describe each other in 3 words"
- "No phones for 30 minutes"
- "Let your partner order for you"
- "Take 1 polaroid-style photo only"

Keep totalEstimatedCost = activity.estimatedCost + food.estimatedCost. The challenge has no cost unless intrinsic (e.g. ₹50 gift × 2 = ₹100).`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: ctx },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "spin_roulette" } },
        // bump variability so each spin feels fresh
        temperature: 1.1,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Spin again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    if (!args) {
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("date-roulette error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
