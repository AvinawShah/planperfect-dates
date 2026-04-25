// Edge function: Turn a date itinerary into a warm, emotional "Date Story" memory.
// Uses Lovable AI Gateway (Gemini) with structured tool output.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ItineraryItem {
  time: string;
  place: string;
  activity: string;
  cost?: number;
  emoji?: string;
  note?: string;
}

interface StoryPayload {
  title?: string;
  mood?: string;
  location?: string;
  itinerary: ItineraryItem[];
  highlights?: string[];
  photos?: string[]; // optional photo descriptions
}

const STORY_TOOL = {
  type: "function",
  function: {
    name: "write_date_story",
    description:
      "Compose a warm, emotional 120-200 word memory of a date, plus a highlight and Instagram caption.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Playful title with an emoji, e.g. 'Your Date Story 💖'" },
        story: {
          type: "string",
          description:
            "120-200 word personal memory written like prose. Opening, emotional middle, closing feeling. Warm, not robotic. May include 1-2 emojis sparingly.",
        },
        highlight: {
          type: "string",
          description: "Single best moment — one warm sentence, ideally with an emoji like ❤️ or 😂.",
        },
        caption: {
          type: "string",
          description: "Short Instagram-style caption (max ~120 chars) with 1-2 emojis and maybe a hashtag.",
        },
      },
      required: ["title", "story", "highlight", "caption"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const payload = (await req.json()) as StoryPayload;

    if (!payload?.itinerary?.length) {
      return new Response(JSON.stringify({ error: "itinerary required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timeline = payload.itinerary
      .map(
        (i) =>
          `• ${i.time} — ${i.activity} at ${i.place}${i.emoji ? ` ${i.emoji}` : ""}${
            i.note ? ` (${i.note})` : ""
          }`,
      )
      .join("\n");

    const ctx = [
      payload.title ? `Plan: ${payload.title}` : "",
      payload.location ? `Location: ${payload.location}` : "",
      payload.mood ? `Mood: ${payload.mood}` : "",
      payload.highlights?.length ? `Highlights: ${payload.highlights.join(", ")}` : "",
      payload.photos?.length ? `Photo notes: ${payload.photos.join("; ")}` : "",
      "",
      "Itinerary:",
      timeline,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are a romantic storyteller who turns a date itinerary into a short, emotional memory.
Write like a personal memory, not a list. 120-200 words. Warm, sensory, real.
Structure: opening (how it started) → middle (emotional/fun highlights, small moments, laughs, glances) → closing (lingering feeling).
Avoid cliches like "amazing time" or "unforgettable journey". Use concrete details from the itinerary.
Then provide a single best-moment highlight (one sentence with an emoji like ❤️ or 😂) and a short Instagram-style caption.`;

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
        tools: [STORY_TOOL],
        tool_choice: { type: "function", function: { name: "write_date_story" } },
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
    console.error("date-story error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
