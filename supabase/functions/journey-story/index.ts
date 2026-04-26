// Journey Story — generates AI memory narratives for the Relationship Map.
// Returns per-stop micro-stories, an overall narrative, pattern insights, and highlights.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Stop {
  place: string;
  date?: string;
  notes?: string;
  mood?: string;
  activity?: string;
}

interface Payload {
  stops: Stop[];
  city?: string;
  coupleNames?: string;
}

const TOOL = {
  type: "function",
  function: {
    name: "render_journey",
    description:
      "Generate a narrative-rich relationship map: per-stop memories, overall arc, highlights, and pattern insights.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "A poetic 3-6 word title for the journey." },
        opening: {
          type: "string",
          description:
            "Story-mode opening line, like 'It all started at a small café…' (one sentence).",
        },
        memories: {
          type: "array",
          description: "One per stop, in the same order received.",
          items: {
            type: "object",
            properties: {
              place: { type: "string" },
              icon: {
                type: "string",
                description:
                  "Single emoji that fits this stop (heart, sparkle, food, music, sunset, etc.).",
              },
              importance: {
                type: "string",
                enum: ["low", "medium", "high"],
                description:
                  "How memorable this stop is in the relationship arc.",
              },
              moodEmoji: {
                type: "string",
                description: "One emoji capturing the felt mood (❤️ 😂 🌙 ✨ ☕ 🍰).",
              },
              memory: {
                type: "string",
                description:
                  "2-3 warm, sensory sentences in second person, like a remembered moment.",
              },
              pathStyle: {
                type: "string",
                enum: ["dotted", "smooth", "glowing"],
                description:
                  "Path style FROM the previous stop TO this one. First stop should be 'dotted'.",
              },
            },
            required: [
              "place",
              "icon",
              "importance",
              "moodEmoji",
              "memory",
              "pathStyle",
            ],
            additionalProperties: false,
          },
        },
        narrative: {
          type: "string",
          description:
            "A flowing 90-140 word Story-Mode narrative weaving every stop into one journey. Warm, second-person, never list-like.",
        },
        highlights: {
          type: "object",
          properties: {
            firstDate: { type: "string", description: "Place name of the first stop." },
            bestDate: { type: "string", description: "Place name of the most romantic / important stop." },
            funniest: { type: "string", description: "Place name of the most playful / funniest stop." },
          },
          required: ["firstDate", "bestDate", "funniest"],
          additionalProperties: false,
        },
        insights: {
          type: "array",
          description: "2-4 short pattern insights, e.g. 'You love dessert spots 🍰'.",
          items: { type: "string" },
        },
      },
      required: [
        "title",
        "opening",
        "memories",
        "narrative",
        "highlights",
        "insights",
      ],
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
    if (!p?.stops || p.stops.length < 1) {
      return new Response(JSON.stringify({ error: "Provide at least one stop." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = [
      p.coupleNames ? `Couple: ${p.coupleNames}` : "",
      p.city ? `City: ${p.city}` : "",
      "Stops (in order):",
      ...p.stops.map(
        (s, i) =>
          `${i + 1}. ${s.place}${s.date ? ` — ${s.date}` : ""}${
            s.activity ? ` — ${s.activity}` : ""
          }${s.mood ? ` — mood: ${s.mood}` : ""}${
            s.notes ? ` — note: ${s.notes}` : ""
          }`,
      ),
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are DateCraft's Relationship Map storyteller. You turn a list of visited places into an emotional memory journey.

TONE:
- Warm, intimate, cinematic. Second person ("you both", "the two of you").
- Sensory details (light, sound, taste, weather) — but never overwrought.
- Avoid list-y / robotic phrasing. Each memory should feel like a remembered scene.

PATH STYLE EVOLUTION:
- First stop: "dotted" (uncertain start)
- Middle stops: mostly "smooth" (growing connection)
- Late / important stops: "glowing" (strong bond)
- Use importance to influence pathStyle and emoji size hints.

CONSTRAINTS:
- Memories: 2-3 sentences, vivid but tight.
- Narrative: 90-140 words, single flowing paragraph weaving every stop.
- Insights: short, observational, can include 1 emoji.
- Highlights MUST reference exact place names from the input.`;

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
        tool_choice: { type: "function", function: { name: "render_journey" } },
        temperature: 0.9,
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
          JSON.stringify({
            error:
              "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          }),
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
    console.error("journey-story error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
