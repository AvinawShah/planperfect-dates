// DateCraft API client.
// Set VITE_API_URL=https://your-backend.example.com to hit your real Node/Express backend.
// When unset, returns realistic mock data so the app is fully demoable.

import { mockDeals, mockEvents, mockItinerary } from "./mockData";
import { supabase } from "@/integrations/supabase/client";

export type Mood = "romantic" | "adventurous" | "chill" | "foodie" | "cultural" | "playful" | "spiritual";

export interface PlanInput {
  budget: number;
  currency: string;
  mood: Mood;
  startTime: string; // e.g. "17:30"
  durationHours: number;
  location: { lat: number; lng: number; label?: string };
  // Optional rich context (used by AI)
  city?: string;
  area?: string;
  cuisines?: string[];
  vibes?: string[];
  transport?: string;
  dietary?: string[];
  weather?: string;
  occasion?: string;
}

export interface VibePrediction {
  suggestedMood: Mood;
  confidence: number;
  reasoning: string;
  tips: string[];
  suggestedVibes: string[];
}

export interface ItineraryItem {
  time: string;
  place: string;
  activity: string;
  cost: number;
  emoji?: string;
  note?: string;
}

export interface Plan {
  id: string;
  title: string;
  budget: number;
  currency: string;
  mood: Mood;
  location: string;
  itinerary: ItineraryItem[];
  totalCost: number;
  createdAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  type: string;
  location: string;
  price: number;
  currency: string;
  date: string;
  image: string;
  tag?: string;
}

export interface Deal {
  id: string;
  title: string;
  discount: string;
  partner: string;
  location: string;
  emoji: string;
  category: string;
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

async function tryFetch<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  if (!API_URL) {
    if (fallback === undefined) throw new Error("No API_URL and no fallback");
    // simulate network feel
    await new Promise((r) => setTimeout(r, 600));
    return fallback;
  }
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

export async function generatePlan(input: PlanInput): Promise<Plan> {
  const fallback = mockItinerary(input);

  // Try Lovable AI edge function first for a real AI itinerary
  try {
    const { data, error } = await supabase.functions.invoke("ai-suggest", {
      body: {
        mode: "plan",
        city: input.city || input.location.label || "Bengaluru",
        area: input.area,
        budget: input.budget,
        currency: input.currency,
        mood: input.mood,
        startTime: input.startTime,
        durationHours: input.durationHours,
        cuisines: input.cuisines,
        vibes: input.vibes,
        transport: input.transport,
        dietary: input.dietary,
        weather: input.weather,
        occasion: input.occasion,
      },
    });
    if (error) throw error;
    if (data?.itinerary?.length) {
      const total = data.itinerary.reduce((s: number, i: ItineraryItem) => s + (i.cost || 0), 0);
      return {
        id: `plan_${Date.now()}`,
        title: data.title || `${input.mood} date`,
        budget: input.budget,
        currency: input.currency,
        mood: input.mood,
        location: input.area ? `${input.area}, ${input.city}` : (input.city || input.location.label || ""),
        itinerary: data.itinerary,
        totalCost: total,
        createdAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("AI plan failed, using fallback:", err);
  }

  // Fallback to legacy backend or mock
  return tryFetch<Plan>("/api/plan/generate", { method: "POST", body: JSON.stringify(input) }, fallback);
}

export async function predictVibe(
  input: Omit<PlanInput, "mood" | "currency" | "location"> & { city: string; area?: string },
): Promise<VibePrediction | null> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-suggest", {
      body: {
        mode: "predict",
        city: input.city,
        area: input.area,
        budget: input.budget,
        startTime: input.startTime,
        durationHours: input.durationHours,
        cuisines: input.cuisines,
        vibes: input.vibes,
        transport: input.transport,
        dietary: input.dietary,
        weather: input.weather,
        occasion: input.occasion,
      },
    });
    // Gracefully handle rate limits & errors — never throw from predict.
    if (error) {
      const msg = (error as { message?: string })?.message || "";
      if (msg.includes("429") || msg.toLowerCase().includes("rate")) {
        console.info("predictVibe rate limited, skipping");
      } else {
        console.warn("predictVibe error:", error);
      }
      return null;
    }
    if (data && typeof data === "object" && "error" in data) return null;
    return data as VibePrediction;
  } catch (err) {
    console.warn("predictVibe failed:", err);
    return null;
  }
}

export interface DateStory {
  title: string;
  story: string;
  highlight: string;
  caption: string;
}

export async function generateDateStory(plan: Plan, opts?: { highlights?: string[]; photos?: string[] }): Promise<DateStory> {
  const { data, error } = await supabase.functions.invoke("date-story", {
    body: {
      title: plan.title,
      mood: plan.mood,
      location: plan.location,
      itinerary: plan.itinerary,
      highlights: opts?.highlights,
      photos: opts?.photos,
    },
  });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data) {
    throw new Error((data as { error: string }).error);
  }
  return data as DateStory;
}

export async function surpriseMe(): Promise<Plan> {
  const input: PlanInput = {
    budget: 1500,
    currency: "₹",
    mood: "playful",
    startTime: "17:30",
    durationHours: 4,
    location: { lat: 12.97, lng: 77.59, label: "Bengaluru" },
  };
  return generatePlan(input);
}

export async function listEvents(): Promise<EventItem[]> {
  return tryFetch<EventItem[]>("/api/events", undefined, mockEvents);
}

export async function listDeals(): Promise<Deal[]> {
  return tryFetch<Deal[]>("/api/deals", undefined, mockDeals);
}

// --- Saved plans (localStorage until backend is wired) ---
const STORAGE_KEY = "datecraft.savedPlans";

export function getSavedPlans(): Plan[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export function savePlan(plan: Plan): void {
  const all = getSavedPlans();
  if (!all.find((p) => p.id === plan.id)) {
    all.unshift(plan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 50)));
  }
}

export function deletePlan(id: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getSavedPlans().filter((p) => p.id !== id)));
}

// --- Mock auth (until backend) ---
const AUTH_KEY = "datecraft.user";
export interface AuthUser { name: string; email: string; }

export function getCurrentUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch { return null; }
}
export function signIn(email: string, name?: string): AuthUser {
  const user = { name: name || email.split("@")[0], email };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}
export function signOut() { localStorage.removeItem(AUTH_KEY); }
