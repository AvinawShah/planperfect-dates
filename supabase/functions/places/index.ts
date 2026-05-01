// Google Places + Geocoding proxy. Keeps GOOGLE_MAPS_API_KEY server-side.
import { corsHeaders } from "../_shared/cors.ts";

const KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

// Map a budget (INR) to a Google price_level filter (0-4).
// 0=Free, 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive
function budgetToMaxPriceLevel(budgetInr?: number): number {
  if (!budgetInr || budgetInr <= 0) return 4;
  if (budgetInr <= 500) return 1;
  if (budgetInr <= 1500) return 2;
  if (budgetInr <= 4000) return 3;
  return 4;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!KEY) throw new Error("GOOGLE_MAPS_API_KEY not configured");
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // ── 1) Autocomplete: text → suggestions
    if (action === "autocomplete") {
      const input = String(body.input ?? "").trim();
      if (!input) return json({ predictions: [] });
      const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": KEY,
        },
        body: JSON.stringify({
          input,
          languageCode: "en",
          regionCode: body.region ?? "IN",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(`autocomplete ${r.status}: ${JSON.stringify(data)}`);
      const predictions = (data.suggestions ?? [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          placeId: s.placePrediction.placeId,
          text: s.placePrediction.text?.text,
          main: s.placePrediction.structuredFormat?.mainText?.text,
          secondary: s.placePrediction.structuredFormat?.secondaryText?.text,
        }));
      return json({ predictions });
    }

    // ── 2) Place details: placeId → lat/lng + label
    if (action === "details") {
      const placeId = String(body.placeId ?? "");
      if (!placeId) throw new Error("placeId required");
      const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          "X-Goog-Api-Key": KEY,
          "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
        },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(`details ${r.status}: ${JSON.stringify(d)}`);
      const comps = d.addressComponents ?? [];
      const city =
        comps.find((c: any) => c.types?.includes("locality"))?.longText ??
        comps.find((c: any) => c.types?.includes("administrative_area_level_2"))?.longText ??
        comps.find((c: any) => c.types?.includes("administrative_area_level_1"))?.longText ??
        "";
      return json({
        placeId: d.id,
        name: d.displayName?.text ?? "",
        address: d.formattedAddress ?? "",
        lat: d.location?.latitude,
        lng: d.location?.longitude,
        city,
      });
    }

    // ── 3) Reverse geocode: lat/lng → human label + city
    if (action === "reverse") {
      const lat = Number(body.lat), lng = Number(body.lng);
      if (!isFinite(lat) || !isFinite(lng)) throw new Error("lat/lng required");
      const r = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${KEY}`,
      );
      const d = await r.json();
      if (!r.ok || d.status !== "OK") throw new Error(`reverse ${r.status}: ${d.status} ${d.error_message ?? ""}`);
      const top = d.results[0];
      const comps = top?.address_components ?? [];
      const find = (t: string) => comps.find((c: any) => c.types.includes(t))?.long_name ?? "";
      const area = find("sublocality_level_1") || find("sublocality") || find("neighborhood") || find("locality");
      const city = find("locality") || find("administrative_area_level_2") || find("administrative_area_level_1");
      return json({
        label: top?.formatted_address ?? `${lat},${lng}`,
        area: area || "Current location",
        city: city || "",
        lat, lng,
      });
    }

    // ── 4) Nearby cafes filtered by budget
    if (action === "nearby_cafes") {
      const lat = Number(body.lat), lng = Number(body.lng);
      const radius = Math.min(Math.max(Number(body.radius ?? 1500), 200), 5000);
      const limit = Math.min(Math.max(Number(body.limit ?? 12), 1), 20);
      const budget = Number(body.budget ?? 0);
      const maxPrice = budgetToMaxPriceLevel(budget);

      if (!isFinite(lat) || !isFinite(lng)) throw new Error("lat/lng required");

      const r = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.types,places.currentOpeningHours.openNow",
        },
        body: JSON.stringify({
          includedTypes: ["cafe", "bakery", "coffee_shop"],
          maxResultCount: 20,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
          rankPreference: "DISTANCE",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(`nearby ${r.status}: ${JSON.stringify(d)}`);

      // Google returns price_level as enum: PRICE_LEVEL_FREE..PRICE_LEVEL_VERY_EXPENSIVE
      const priceMap: Record<string, number> = {
        PRICE_LEVEL_FREE: 0,
        PRICE_LEVEL_INEXPENSIVE: 1,
        PRICE_LEVEL_MODERATE: 2,
        PRICE_LEVEL_EXPENSIVE: 3,
        PRICE_LEVEL_VERY_EXPENSIVE: 4,
      };

      const cafes = (d.places ?? [])
        .map((p: any) => {
          const pl = p.priceLevel ? priceMap[p.priceLevel] : undefined;
          return {
            id: p.id,
            name: p.displayName?.text ?? "Unnamed",
            address: p.formattedAddress ?? "",
            lat: p.location?.latitude,
            lng: p.location?.longitude,
            rating: p.rating,
            reviews: p.userRatingCount,
            priceLevel: pl,
            mapsUrl: p.googleMapsUri,
            openNow: p.currentOpeningHours?.openNow,
          };
        })
        .filter((c: any) => c.priceLevel === undefined || c.priceLevel <= maxPrice)
        .slice(0, limit);

      return json({ cafes, maxPrice, budget });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("places fn error:", msg);
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
