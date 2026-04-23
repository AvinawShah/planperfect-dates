// DateCraft API client.
// Set VITE_API_URL=https://your-backend.example.com to hit your real Node/Express backend.
// When unset, returns realistic mock data so the app is fully demoable.

import { mockDeals, mockEvents, mockItinerary } from "./mockData";

export type Mood = "romantic" | "adventurous" | "chill" | "foodie" | "cultural" | "playful";

export interface PlanInput {
  budget: number;
  currency: string;
  mood: Mood;
  startTime: string; // e.g. "17:30"
  durationHours: number;
  location: { lat: number; lng: number; label?: string };
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
  return tryFetch<Plan>("/api/plan/generate", { method: "POST", body: JSON.stringify(input) }, fallback);
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
