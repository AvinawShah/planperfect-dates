import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const schema = z.object({
  location: z.string().trim().min(1).max(250),
  places: z.array(z.string().trim().min(1).max(250)).min(1).max(8),
  mode: z.enum(["WALK", "DRIVE"]).default("WALK"),
});
const cache = new Map<string, { expires: number; data: unknown }>();
const pending = new Map<string, Promise<unknown>>();
const gateway = "https://connector-gateway.lovable.dev/google_maps";
class ProviderError extends Error {
  constructor(public status: number, public details: string, message: string) { super(message); }
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

async function google(path: string, body: unknown, fields: string) {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || !lovableKey) throw new Error("Google Maps is not connected yet.");
  const response = await fetch(`${gateway}${path}`, {
    method: "POST", headers: {
      Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": apiKey,
      "Content-Type": "application/json", "X-Goog-FieldMask": fields,
    }, body: JSON.stringify(body), signal: AbortSignal.timeout(18000),
  });
  if (!response.ok) {
    const details = await response.text();
    console.error(`Google Maps [${response.status}]: ${details}`);
    let message = "Google Maps could not load this route.";
    if (response.status === 403) {
      let reason = "";
      try { reason = JSON.parse(details)?.error?.details?.find((d: { reason?: string }) => d.reason)?.reason ?? ""; } catch { /* preserve raw failure */ }
      message = reason === "API_KEY_HTTP_REFERRER_BLOCKED"
        ? "Google Maps server key is referrer-restricted. Set its application restrictions to None or IP addresses in Google Cloud Console."
        : reason === "API_KEY_SERVICE_BLOCKED"
        ? "Google Maps server key does not allow this API. Enable Places API (New) and Routes API and add them to the key’s allowed APIs."
        : "Google Maps denied the request. Check the server key’s restrictions in Google Cloud Console.";
    }
    throw new ProviderError(response.status, details, message);
  }
  return response.json();
}

async function resolve(input: z.infer<typeof schema>) {
  const stops: Array<{ index: number; name: string; address?: string; placeId?: string; lat?: number; lng?: number }> = [];
  // At most two concurrent lookups, eight stops, and one route per explicit request.
  for (let i = 0; i < input.places.length; i += 2) {
    const batch = await Promise.all(input.places.slice(i, i + 2).map(async (name, offset) => {
      const result = await google("/places/v1/places:searchText", {
        textQuery: `${name}, ${input.location}`, pageSize: 1,
      }, "places.id,places.displayName,places.formattedAddress,places.location");
      const place = result.places?.[0];
      const lat = place?.location?.latitude;
      const lng = place?.location?.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { index: i + offset, name };
      return { index: i + offset, name: place.displayName?.text || name, address: place.formattedAddress,
        placeId: place.id, lat, lng };
    }));
    stops.push(...batch);
  }
  if (stops.some(s => s.lat === undefined) || stops.length < 2) {
    return { stops, encodedPolyline: null, legs: [], routeMessage: stops.length < 2
      ? "One stop — no travel route needed." : "Some stops could not be found. A full route is unavailable; check each venue before setting off." };
  }
  const waypoint = (s: typeof stops[number]) => ({ placeId: s.placeId });
  const result = await google("/routes/directions/v2:computeRoutes", {
    origin: waypoint(stops[0]), destination: waypoint(stops[stops.length - 1]),
    intermediates: stops.slice(1, -1).map(waypoint), travelMode: input.mode,
    computeAlternativeRoutes: false,
  }, "routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration");
  const route = result.routes?.[0];
  if (!route) return { stops, encodedPolyline: null, legs: [], routeMessage: "No route available for this travel mode. Try driving or open directions for an individual stop." };
  const legs = route.legs?.map((leg: { distanceMeters?: number; duration?: string }) => {
    const seconds = typeof leg.duration === "string" && /^\d+(\.\d+)?s$/.test(leg.duration)
      ? Number(leg.duration.slice(0, -1)) : NaN;
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error("Google returned an incomplete travel time.");
    const distanceMeters = leg.distanceMeters ?? 0;
    if (!Number.isFinite(distanceMeters) || distanceMeters < 0) throw new Error("Google returned an invalid route distance.");
    return { distanceMeters, seconds };
  }) ?? [];
  if (legs.length !== stops.length - 1 || !route.polyline?.encodedPolyline) throw new Error("Google returned an incomplete route.");
  return { stops, encodedPolyline: route.polyline.encodedPolyline, legs, routeMessage: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authorization = req.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "Sign in to load your itinerary map." }, 401);
    const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: { user }, error } = await client.auth.getUser(authorization.slice(7));
    if (error || !user) return json({ error: "Sign in to load your itinerary map." }, 401);
    let body;
    try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Choose 1–8 stops and a location to load a route." }, 400);
    const key = `${user.id}:${JSON.stringify(parsed.data)}`;
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return json(hit.data);
    let work = pending.get(key);
    if (!work) {
      work = resolve(parsed.data);
      pending.set(key, work);
    }
    try {
      const data = await work;
      if (cache.size >= 100) cache.delete(cache.keys().next().value ?? "");
      cache.set(key, { data, expires: Date.now() + 10 * 60 * 1000 });
      return json(data);
    } finally { pending.delete(key); }
  } catch (error) {
    if (error instanceof ProviderError) return json({ error: error.message, status: error.status, details: error.details }, error.status);
    return json({ error: error instanceof Error ? error.message : "Could not load itinerary map." }, 500);
  }
});