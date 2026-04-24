import type { Deal, EventItem, Plan, PlanInput, ItineraryItem, Mood } from "./api";

const moodMap: Record<Mood, { title: string; flow: Array<{ activity: string; place: string; emoji: string; share: number }> }> = {
  romantic: {
    title: "Candlelit Romance",
    flow: [
      { activity: "Sunset walk", place: "Cubbon Park promenade", emoji: "🌅", share: 0.05 },
      { activity: "Wine & small plates", place: "The Permit Room", emoji: "🍷", share: 0.45 },
      { activity: "Rooftop dessert", place: "Toit Terrace", emoji: "🍰", share: 0.3 },
      { activity: "Slow drive home", place: "MG Road", emoji: "🚖", share: 0.2 },
    ],
  },
  foodie: {
    title: "Tastebud Tour",
    flow: [
      { activity: "Street food crawl", place: "VV Puram Food Street", emoji: "🍜", share: 0.25 },
      { activity: "Craft cocktails", place: "ZLB 23", emoji: "🍹", share: 0.4 },
      { activity: "Artisan dessert", place: "Glen's Bakehouse", emoji: "🍮", share: 0.25 },
      { activity: "Late chai", place: "Indian Coffee House", emoji: "☕", share: 0.1 },
    ],
  },
  playful: {
    title: "Fun Evening",
    flow: [
      { activity: "Street food", place: "Thindi Beedi", emoji: "🍜", share: 0.2 },
      { activity: "Stand-up comedy", place: "That Comedy Club", emoji: "🎤", share: 0.45 },
      { activity: "Ice cream walk", place: "Corner House", emoji: "🍦", share: 0.2 },
      { activity: "Arcade games", place: "Smaaash", emoji: "🎯", share: 0.15 },
    ],
  },
  adventurous: {
    title: "Out of the Ordinary",
    flow: [
      { activity: "Climbing session", place: "Equilibrium Climbing", emoji: "🧗", share: 0.4 },
      { activity: "Recovery smoothies", place: "Punjab Grill Junior", emoji: "🥤", share: 0.2 },
      { activity: "Live music venue", place: "Fandom at Gilly's", emoji: "🎸", share: 0.4 },
    ],
  },
  chill: {
    title: "Slow & Sweet",
    flow: [
      { activity: "Bookshop browse", place: "Champaca Bookstore", emoji: "📚", share: 0.15 },
      { activity: "Specialty coffee", place: "Third Wave Coffee", emoji: "☕", share: 0.2 },
      { activity: "Pasta dinner", place: "Toscano", emoji: "🍝", share: 0.5 },
      { activity: "Stargazing terrace", place: "Lalbagh viewpoint", emoji: "⭐", share: 0.15 },
    ],
  },
  cultural: {
    title: "Art & Soul",
    flow: [
      { activity: "Gallery visit", place: "NGMA Bengaluru", emoji: "🖼️", share: 0.2 },
      { activity: "Indie film screening", place: "Bangalore International Centre", emoji: "🎬", share: 0.3 },
      { activity: "Slow dinner", place: "Karavalli", emoji: "🍛", share: 0.45 },
      { activity: "Bookstore nightcap", place: "Atta Galatta", emoji: "📖", share: 0.05 },
    ],
  },
  spiritual: {
    title: "Temple & Tea",
    flow: [
      { activity: "Morning temple visit", place: "ISKCON Temple", emoji: "🛕", share: 0.05 },
      { activity: "Quiet courtyard walk", place: "Bull Temple", emoji: "🌿", share: 0.05 },
      { activity: "Sattvic thali lunch", place: "Mahesh Lunch Home", emoji: "🍛", share: 0.55 },
      { activity: "Filter coffee & journal", place: "Airlines Hotel", emoji: "☕", share: 0.35 },
    ],
  },
};

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  const period = hh >= 12 ? "PM" : "AM";
  const display = ((hh + 11) % 12) + 1;
  return `${display}:${mm.toString().padStart(2, "0")} ${period}`;
}

export function mockItinerary(input: PlanInput): Plan {
  const m = moodMap[input.mood] ?? moodMap.romantic;
  const stepMinutes = Math.floor((input.durationHours * 60) / m.flow.length);
  const items: ItineraryItem[] = m.flow.map((step, i) => ({
    time: addMinutes(input.startTime, i * stepMinutes),
    place: step.place,
    activity: step.activity,
    emoji: step.emoji,
    cost: Math.round(input.budget * step.share),
  }));
  const total = items.reduce((s, i) => s + i.cost, 0);
  return {
    id: `plan_${Date.now()}`,
    title: m.title,
    budget: input.budget,
    currency: input.currency,
    mood: input.mood,
    location: input.location.label || `${input.location.lat.toFixed(2)}, ${input.location.lng.toFixed(2)}`,
    itinerary: items,
    totalCost: total,
    createdAt: new Date().toISOString(),
  };
}

import eventMusic from "@/assets/event-music.jpg";
import eventComedy from "@/assets/event-comedy.jpg";
import eventWorkshop from "@/assets/event-workshop.jpg";

export const mockEvents: EventItem[] = [
  { id: "e1", title: "Acoustic Sunday: Indie Sessions", type: "Live music", location: "Fandom, Koramangala", price: 499, currency: "₹", date: "Sun · 7:30 PM", image: eventMusic, tag: "Great for dates" },
  { id: "e2", title: "Open Mic Comedy Night", type: "Comedy", location: "That Comedy Club, HSR", price: 299, currency: "₹", date: "Fri · 9:00 PM", image: eventComedy, tag: "Couples love it" },
  { id: "e3", title: "Pottery for Two — Hands & Clay", type: "Workshop", location: "Clay Station, Indiranagar", price: 1200, currency: "₹", date: "Sat · 4:00 PM", image: eventWorkshop, tag: "Date-friendly" },
  { id: "e4", title: "Wine Tasting & Cheese Board", type: "Tasting", location: "Toit Loft, Indiranagar", price: 1499, currency: "₹", date: "Thu · 8:00 PM", image: eventMusic, tag: "Date night pick" },
];

export const mockDeals: Deal[] = [
  { id: "d1", title: "Free dessert for two", discount: "Free 🍰", partner: "Glen's Bakehouse", location: "Lavelle Road", emoji: "🍰", category: "Dessert" },
  { id: "d2", title: "10% off candlelit dinners", discount: "10% off", partner: "The Permit Room", location: "Church Street", emoji: "🍷", category: "Dining" },
  { id: "d3", title: "Buy 1 Get 1 cocktails", discount: "BOGO 🍹", partner: "ZLB 23", location: "MG Road", emoji: "🍹", category: "Bar" },
  { id: "d4", title: "20% off couples' tickets", discount: "20% off", partner: "PVR ICON", location: "Phoenix Mall", emoji: "🎬", category: "Movies" },
  { id: "d5", title: "Free chocolates with brunch", discount: "Free 🍫", partner: "Cafe Noir", location: "UB City", emoji: "🍫", category: "Brunch" },
  { id: "d6", title: "15% off pottery for two", discount: "15% off", partner: "Clay Station", location: "Indiranagar", emoji: "🏺", category: "Workshop" },
];
