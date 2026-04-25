// Edge function: Couple Compatibility — analyze two profiles, propose balanced plan.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UserProfile {
  name?: string;
  personality?: string; // introvert | extrovert | mixed
  preferences?: string;
  budget?: number;
  mood?: string;
  interests?: string[];
  dislikes?: string[];
  behaviors?: string[];
}

interface NearbyPlace {
  name: string;
  type?: string;
  cost?: number;
  vibe?: string;
}

interface Payload {
  city?: string;
  area?: string;
  startTime?: string;
  durationHours?: number;
  userA: UserProfile;
  userB: UserProfile;
  nearbyPlaces?: NearbyPlace[];
}

const TOOL = {
  type: "function",
  function: {
    name: "build_compat_plan",
    description: "Analyze two profiles and propose a balanced date plan.",
    parameters: {
      type: "object",
      properties: {
        compatibility: {
          type: "object",
          properties: {
            score: { type: "string", description: "Percentage like '82%'." },
            summary: { type: "string", description: "1-2 sentence explanation." },
            commonInterests: { type: "array", items: { type: "string" } },
            differences: { type: "array", items: { type: "string" } },
          },
          required: ["score", "summary", "commonInterests", "differences"],
          additionalProperties: false,
        },
        plan: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              time: { type: "string", description: "e.g. 5:30 PM" },
              place: { type: "string", description: "Real venue / area name" },
              activity: { type: "string" },
              cost: { type: "number" },
              emoji: { type: "string" },
              chosenFor: {
                type: "string",
                enum: ["User A", "User B", "Both"],
              },
              reason: { type: "string", description: "Why this balances preferences." },
            },
            required: ["time", "place", "activity", "cost", "emoji", "chosenFor", "reason"],
            additionalProperties: false,
          },
        },
        insight: { type: "string", description: "1-2 line relationship insight." },
        funNote: { type: "string", description: "Light playful comment about the couple." },
      },
      required: ["compatibility", "plan", "insight", "funNote"],
      additionalProperties: false,
    },
  },
};

function profileBlock(label: string, p: UserProfile): string {
  return [
    `${label}:`,
    p.name ? `  Name: ${p.name}` : "",
    p.personality ? `  Personality: ${p.personality}` : "",
    p.preferences ? `  Preferences: ${p.preferences}` : "",
    typeof p.budget === "number" ? `  Budget: ₹${p.budget}` : "",
    p.mood ? `  Mood: ${p.mood}` : "",
    p.interests?.length ? `  Interests: ${p.interests.join(", ")}` : "",
    p.dislikes?.length ? `  Dislikes: ${p.dislikes.join(", ")}` : "",
    p.behaviors?.length ? `  Behaviors: ${p.behaviors.join(", ")}` : "",
  ].filter(Boolean).join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const payload = (await req.json()) as Payload;
    if (!payload.userA || !payload.userB) {
      return new Response(JSON.stringify({ error: "userA and userB required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalBudget = (payload.userA.budget || 0) + (payload.userB.budget || 0);
    const ctx = [
      `City: ${payload.city || "Bengaluru"}${payload.area ? `, ${payload.area}` : ""}`,
      payload.startTime ? `Start: ${payload.startTime}` : "",
      payload.durationHours ? `Duration: ${payload.durationHours}h` : "",
      totalBudget ? `Combined budget: ₹${totalBudget}` : "",
      profileBlock("User A", payload.userA),
      profileBlock("User B", payload.userB),
      payload.nearbyPlaces?.length
        ? `Nearby places:\n${payload.nearbyPlaces.map((p) =>
            `  - ${p.name}${p.type ? ` (${p.type})` : ""}${p.vibe ? ` · ${p.vibe}` : ""}${p.cost ? ` · ₹${p.cost}` : ""}`,
          ).join("\n")}`
        : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are an AI relationship planner that designs the perfect shared date for two people in Indian cities.
Analyze BOTH profiles deeply: explicit preferences AND behavioral patterns (introvert vs extrovert, spontaneous vs planned, foodie vs activity).
Identify common interests, conflicting preferences, and the shared vibe.
Build a balanced 3-5 step itinerary with REAL well-known venues. When preferences conflict, find middle ground OR alternate steps (one for A, one for B). Mark each step's chosenFor as "User A", "User B", or "Both".
Stay within combined budget. Keep timing logical, costs realistic in INR. Be warm, specific, no clichés.`;

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
        tool_choice: { type: "function", function: { name: "build_compat_plan" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
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
    console.error("couple-compat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
