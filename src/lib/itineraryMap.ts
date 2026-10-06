import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import type { Plan } from "./api";

export type TravelMode = "WALK" | "DRIVE";
export interface RouteStop {
  index: number; name: string; address?: string; placeId?: string; lat?: number; lng?: number;
}
export interface ItineraryRoute {
  stops: RouteStop[];
  encodedPolyline: string | null;
  legs: { distanceMeters: number; seconds: number }[];
  routeMessage: string | null;
}

let mapsPromise: Promise<void> | undefined;
export function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    const key = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'];
    if (!key) { reject(new Error("Connect Google Maps to display your route.")); return; }
    const script = document.createElement("script");
    const globals = window as unknown as Record<string, unknown>;
    const timer = window.setTimeout(() => reject(new Error("Google Maps took too long to load. Please try again.")), 20000);
    globals.datecraftMapReady = () => { window.clearTimeout(timer); resolve(); };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=datecraftMapReady&libraries=geometry&channel=${encodeURIComponent(import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'] || '')}`;
    script.async = true;
    script.onerror = () => { window.clearTimeout(timer); script.remove(); reject(new Error("Google Maps could not load. Check your connection.")); };
    document.head.appendChild(script);
  }).catch(error => { mapsPromise = undefined; throw error; });
  return mapsPromise;
}

export async function fetchItineraryRoute(plan: Plan, mode: TravelMode): Promise<ItineraryRoute> {
  const { data, error } = await supabase.functions.invoke("itinerary-route", {
    body: { location: plan.location, places: plan.itinerary.map(stop => stop.place), mode },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const details = await error.context.text();
      console.error("Itinerary route failed:", details);
      try { const parsed = JSON.parse(details); throw new Error(parsed.error || "Could not load the route."); }
      catch (e) { if (e instanceof SyntaxError) throw new Error("Could not load the route. Please try again."); throw e; }
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return data as ItineraryRoute;
}

export function directionsUrl(plan: Plan, index: number, mode: TravelMode, stops?: RouteStop[], live?: { lat: number; lng: number }) {
  const target = plan.itinerary[index];
  if (!target) return "https://www.google.com/maps";
  const resolved = stops?.find(s => s.index === index);
  const params = new URLSearchParams({ api: "1", destination: resolved?.address || `${target.place}, ${plan.location}`,
    travelmode: mode === "WALK" ? "walking" : "driving" });
  if (resolved?.placeId) params.set("destination_place_id", resolved.placeId);
  if (live) params.set("origin", `${live.lat},${live.lng}`);
  else if (index > 0) {
    const previous = stops?.find(s => s.index === index - 1);
    params.set("origin", previous?.address || `${plan.itinerary[index - 1].place}, ${plan.location}`);
    if (previous?.placeId) params.set("origin_place_id", previous.placeId);
  }
  return `https://www.google.com/maps/dir/?${params}`;
}