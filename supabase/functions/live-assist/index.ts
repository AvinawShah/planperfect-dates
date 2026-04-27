// Real-time AI date assistant — adapts a plan based on live conditions.
// Uses Lovable AI Gateway with structured tool-calling output.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PlanStep {
  time: string;
  place: string;
  activity: string;
  cost: number;
  emoji?: string;
}

interface NearbyAlt {
  name: string;
  type?: string;
  cost?: number;
  vibe?: string;
}

interface Payload {
  plan: PlanStep[];
  currentTime?: string;
  runningLate?: boolean;
  delayMinutes?: number;
  userMood?: "tired" | "excited" | "neutral" | string;
  weather?: "sunny" | "rainy" | "cloudy" | string;
  crowdLevel?: "low" | "medium" | "high" | string;
  trafficLevel?: "low" | "medium" | "high" | string;
  area?: string;
  city?: string;
  budget?: number;
  nearbyAlternatives?: NearbyAlt[];
}

const TOOL = {
  type: "function",
  function: {
    name: "adapt_plan",
    description: "Adapt the date plan to live conditions and return changes plus an updated plan.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["updated", "unchanged"] },
        detectedIssues: {
          type: "array",
          items: { type: "string" },
          description: "Short bullet list of detected real-world issues (e.g. 'Running late by 20 minutes', 'High crowd at current location').",
        },
        changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["skip", "replace", "adjust"] },
              original: { type: "string" },
              new: { type: "string" },
              reason: { type: "string" },
            },
            required: ["type", "original", "new", "reason"],
            additionalProperties: false,
          },
        },
        updatedPlan: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              time: { type: "string" },
              place: { type: "string" },
              activity: { type: "string" },
              cost: { type: "number" },
              emoji: { type: "string" },
            },
            required: ["time", "place", "activity", "cost", "emoji"],
            additionalProperties: false,
          },
        },
        assistantMessage: { type: "string", description: "Short, friendly suggestion (<160 chars)." },
        nextBestAction: { type: "string", description: "One concrete immediate step the couple should take right now (<120 chars)." },
      },
      required: ["status", "detectedIssues", "changes", "updatedPlan", "assistantMessage", "nextBestAction"],
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
    if (!p?.plan?.length) {
      return new Response(JSON.stringify({ error: "Missing plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = [
      `Current time: ${p.currentTime || "unknown"}`,
      `Running late: ${p.runningLate ? "yes" : "no"}${typeof p.delayMinutes === "number" ? ` (by ~${p.delayMinutes} min)` : ""}`,
      `User mood: ${p.userMood || "neutral"}`,
      `Weather: ${p.weather || "unknown"}`,
      `Crowd level: ${p.crowdLevel || "unknown"}`,
      `Traffic level: ${p.trafficLevel || "unknown"}`,
      p.area || p.city ? `Location: ${[p.area, p.city].filter(Boolean).join(", ")}` : "",
      p.budget ? `Budget cap: ₹${p.budget}` : "",
      "",
      "Current plan:",
      p.plan.map((s, i) => `${i + 1}. ${s.time} — ${s.activity} @ ${s.place} (₹${s.cost})`).join("\n"),
      p.nearbyAlternatives?.length
        ? `\nNearby alternatives:\n${p.nearbyAlternatives.map((a) => `- ${a.name}${a.type ? ` (${a.type})` : ""}${a.vibe ? ` — ${a.vibe}` : ""}${typeof a.cost === "number" ? ` ~₹${a.cost}` : ""}`).join("\n")}`
        : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are DateCraft's real-time date assistant guiding a couple mid-date.

STEP 1 — DETECT problems from live context (lateness, rain, crowd, traffic, mood mismatch, budget risk).
STEP 2 — DECIDE smart adaptations:
  • Running late → skip/shorten/merge earlier steps
  • Rain → swap outdoor for indoor
  • Crowded → suggest a quieter nearby option
  • Tired → reduce intensity, switch to chill
  • Excited → keep or enhance energy
  • Heavy traffic → prefer nearby options, push later steps
STEP 3 — OPTIMIZE: keep timeline logical, stay within budget, smooth transitions, avoid unnecessary changes.
STEP 4 — COMMUNICATE: friendly, human, encouraging, short and actionable.

Always return the FULL updated plan (even unchanged steps), a clear list of detected issues, and one concrete nextBestAction the couple should do right now. If nothing needs changing, set status="unchanged", changes=[], and still echo the original plan.`;

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
        tool_choice: { type: "function", function: { name: "adapt_plan" } },
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
    console.error("live-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
