// Edge function: AI-powered date suggestions (mood, vibes, examples, plan)
// Uses Lovable AI Gateway (Gemini). Two modes: "predict" (mood + tips) and "plan" (full itinerary).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PredictPayload {
  mode: "predict";
  city: string;
  area?: string;
  budget: number;
  startTime: string;
  durationHours: number;
  cuisines?: string[];
  vibes?: string[];
  transport?: string;
  dietary?: string[];
  weather?: string;
  occasion?: string;
}

interface PlanPayload {
  mode: "plan";
  city: string;
  area?: string;
  budget: number;
  currency: string;
  mood: string;
  startTime: string;
  durationHours: number;
  cuisines?: string[];
  vibes?: string[];
  transport?: string;
  dietary?: string[];
  weather?: string;
  occasion?: string;
}

type Payload = PredictPayload | PlanPayload;

const PREDICT_TOOL = {
  type: "function",
  function: {
    name: "predict_vibe",
    description: "Predict best mood + give curated tips for a date.",
    parameters: {
      type: "object",
      properties: {
        suggestedMood: {
          type: "string",
          enum: ["romantic", "foodie", "playful", "adventurous", "chill", "cultural"],
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reasoning: { type: "string", description: "1 sentence why this mood fits." },
        tips: {
          type: "array",
          items: { type: "string" },
          description: "3 short, specific tips (max 90 chars each).",
        },
        suggestedVibes: {
          type: "array",
          items: { type: "string" },
          description: "3-4 vibe tags (e.g. cozy, lively, intimate, outdoors).",
        },
      },
      required: ["suggestedMood", "confidence", "reasoning", "tips", "suggestedVibes"],
      additionalProperties: false,
    },
  },
};

const PLAN_TOOL = {
  type: "function",
  function: {
    name: "build_itinerary",
    description: "Build a budget-aware date itinerary using realistic local places.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        itinerary: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              time: { type: "string", description: "e.g. 5:30 PM" },
              place: { type: "string", description: "Real venue or area" },
              activity: { type: "string" },
              cost: { type: "number" },
              emoji: { type: "string" },
              note: { type: "string", description: "Tip or why this place fits." },
            },
            required: ["time", "place", "activity", "cost", "emoji", "note"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "itinerary"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const payload = (await req.json()) as Payload;
    const isPlan = payload.mode === "plan";

    const ctx = [
      `City: ${payload.city}${payload.area ? `, ${payload.area}` : ""}`,
      `Budget: ₹${payload.budget}`,
      `Start: ${payload.startTime}, ${payload.durationHours}h`,
      payload.cuisines?.length ? `Cuisines: ${payload.cuisines.join(", ")}` : "",
      payload.vibes?.length ? `Vibes: ${payload.vibes.join(", ")}` : "",
      payload.transport ? `Transport: ${payload.transport}` : "",
      payload.dietary?.length ? `Dietary: ${payload.dietary.join(", ")}` : "",
      payload.weather ? `Weather: ${payload.weather}` : "",
      payload.occasion ? `Occasion: ${payload.occasion}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = isPlan
      ? `You craft delightful, budget-aware date itineraries in Indian cities. Use REAL, well-known venues for the given city/area. Keep timing logical, costs realistic in INR, and include short personal notes. Mood: ${(payload as PlanPayload).mood}.`
      : `You are DateCraft's vibe predictor. Based on context, infer the best mood and suggest tips and vibe tags. Be warm, specific, no clichés.`;

    const tools = [isPlan ? PLAN_TOOL : PREDICT_TOOL];
    const toolName = isPlan ? "build_itinerary" : "predict_vibe";

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
        tools,
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;

    if (!args) {
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-suggest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
