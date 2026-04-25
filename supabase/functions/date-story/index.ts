// Edge function: Turn a date itinerary + photos into a warm, structured "Date Story" memory.
// Uses Lovable AI Gateway (Gemini) with structured tool output and mood-based tone.

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

interface PhotoInput {
  id: string;        // e.g. "photo1"
  description?: string; // user-provided caption
  dataUrl?: string;     // optional inline image (data:image/...;base64,...)
}

interface StoryPayload {
  title?: string;
  mood?: string;
  location?: string;
  itinerary: ItineraryItem[];
  highlights?: string[];
  photos?: PhotoInput[];
}

const STORY_TOOL = {
  type: "function",
  function: {
    name: "write_date_story",
    description:
      "Compose a warm, structured 120-200 word memory of a date with timeline, highlight, caption, and hashtags.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Playful title with an emoji, e.g. 'Your Date Story 💖'" },
        story: {
          type: "string",
          description:
            "120-200 word personal memory written like prose. Opening, emotional middle, closing feeling. Warm, sensory, slightly cinematic. May include 1-2 emojis sparingly.",
        },
        timeline: {
          type: "array",
          description: "Three structured beats: Beginning, Highlight, Ending. Reference photos by id when given.",
          items: {
            type: "object",
            properties: {
              moment: { type: "string", enum: ["Beginning", "Highlight", "Ending"] },
              description: { type: "string", description: "1-2 vivid sentences describing this beat." },
              photoReference: { type: "string", description: "Photo id like 'photo1' if relevant, else empty string." },
            },
            required: ["moment", "description", "photoReference"],
            additionalProperties: false,
          },
        },
        highlight: {
          type: "string",
          description: "Single most memorable moment — one warm sentence with an emoji like ❤️ or 😂.",
        },
        caption: {
          type: "string",
          description: "Short Instagram-style caption (max ~120 chars) with 1-2 emojis.",
        },
        hashtags: {
          type: "array",
          description: "3-6 short hashtags including #DateNight or similar.",
          items: { type: "string" },
        },
      },
      required: ["title", "story", "timeline", "highlight", "caption", "hashtags"],
      additionalProperties: false,
    },
  },
};

function toneFor(mood?: string): string {
  const m = (mood || "").toLowerCase();
  if (["romantic", "spiritual"].includes(m)) {
    return "Tone: ROMANTIC — poetic, soft, emotional. Slow rhythm, tender imagery, lingering glances.";
  }
  if (["playful", "fun", "adventurous", "foodie"].includes(m)) {
    return "Tone: FUN — playful, energetic, humorous. Quick beats, inside-joke energy, bright sensory pops.";
  }
  return "Tone: CHILL — calm, cozy, reflective. Warm light, easy silences, the comfort of being known.";
}

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

    const photoNotes = (payload.photos || [])
      .map((p, idx) => `- ${p.id || `photo${idx + 1}`}${p.description ? `: ${p.description}` : " (no caption)"}`)
      .join("\n");

    const ctxText = [
      payload.title ? `Plan: ${payload.title}` : "",
      payload.location ? `Location: ${payload.location}` : "",
      payload.mood ? `Mood: ${payload.mood}` : "",
      payload.highlights?.length ? `Special moments: ${payload.highlights.join(", ")}` : "",
      photoNotes ? `Photos:\n${photoNotes}` : "",
      "",
      "Itinerary:",
      timeline,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are an AI memory storyteller who turns a date into a beautiful, emotional story.
Write like a personal memory — warm, sensory, slightly cinematic. 120-200 words.
Structure: opening (how it started) → middle (emotional/fun highlights, small moments) → closing (lingering feeling).
Use concrete details from the itinerary and the photo captions when given. Avoid cliches like "amazing time" or "unforgettable journey".
Then produce a 3-beat timeline (Beginning, Highlight, Ending), a single best-moment highlight, a short Instagram caption, and 3-6 hashtags.
${toneFor(payload.mood)}`;

    // Build multimodal user content if any photos have data URLs.
    const userContent: Array<
      { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    > = [{ type: "text", text: ctxText }];

    for (const p of payload.photos || []) {
      if (p.dataUrl && p.dataUrl.startsWith("data:image")) {
        userContent.push({ type: "image_url", image_url: { url: p.dataUrl } });
      }
    }

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
          { role: "user", content: userContent.length === 1 ? ctxText : userContent },
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
