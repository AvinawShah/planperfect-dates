// Date templates — tap-to-fill examples that pre-populate the planner.
import type { Mood } from "./api";

export interface DateTemplate {
  id: string;
  emoji: string;
  title: string;
  blurb: string;
  mood: Mood;
  budget: number;
  durationHours: number;
  startTime: string;
  vibes: string[];
  cuisines?: string[];
  occasion?: string;
  weather?: string;
  transport?: string;
  area?: string;     // suggested area label
}

export const dateTemplates: DateTemplate[] = [
  {
    id: "first-date",
    emoji: "🌸",
    title: "First Date Spark",
    blurb: "Coffee, a short walk, light bites — easy to extend if it's going well.",
    mood: "chill",
    budget: 800,
    durationHours: 3,
    startTime: "17:00",
    vibes: ["cozy", "intimate"],
    cuisines: ["Cafe"],
    transport: "walk",
  },
  {
    id: "anniversary",
    emoji: "💍",
    title: "Anniversary Night",
    blurb: "Slow dinner, dessert, a quiet view to remember.",
    mood: "romantic",
    budget: 3500,
    durationHours: 4,
    startTime: "19:00",
    vibes: ["intimate", "elegant"],
    cuisines: ["Italian", "Continental"],
    occasion: "Anniversary",
  },
  {
    id: "rainy-sunday",
    emoji: "🌧️",
    title: "Rainy Sunday Brunch",
    blurb: "Lazy plates, hot coffee, indoor bookstore browse.",
    mood: "chill",
    budget: 1200,
    durationHours: 3,
    startTime: "11:30",
    vibes: ["cozy", "indoor"],
    cuisines: ["Continental", "Cafe"],
    weather: "rainy",
  },
  {
    id: "comedy-night",
    emoji: "🎤",
    title: "Comedy Night Out",
    blurb: "Stand-up + late-night street food + ice cream walk.",
    mood: "playful",
    budget: 1500,
    durationHours: 4,
    startTime: "20:00",
    vibes: ["lively", "fun"],
    cuisines: ["Street food"],
  },
  {
    id: "birthday",
    emoji: "🎂",
    title: "Birthday Surprise",
    blurb: "Their favourite cuisine, dessert with a candle, secret rooftop.",
    mood: "romantic",
    budget: 2500,
    durationHours: 4,
    startTime: "19:30",
    vibes: ["celebratory", "intimate"],
    occasion: "Birthday",
  },
  {
    id: "adventure-day",
    emoji: "⛰️",
    title: "Adventure Day",
    blurb: "Climbing or kayaking, recovery smoothies, live music to wind down.",
    mood: "adventurous",
    budget: 2200,
    durationHours: 6,
    startTime: "10:00",
    vibes: ["active", "outdoors"],
    weather: "sunny",
  },
  {
    id: "temple-date",
    emoji: "🛕",
    title: "Temple & Tea Morning",
    blurb: "Quiet temple visit, slow walk, sattvic brunch and filter coffee.",
    mood: "spiritual",
    budget: 700,
    durationHours: 4,
    startTime: "07:30",
    vibes: ["serene", "intimate", "outdoors"],
    cuisines: ["Indian", "Cafe"],
    occasion: "Just because",
    transport: "walk",
  },
  {
    id: "spiritual-sunset",
    emoji: "🪔",
    title: "Aarti & Riverside Sunset",
    blurb: "Evening aarti, quiet riverside walk, soulful dinner.",
    mood: "spiritual",
    budget: 1200,
    durationHours: 4,
    startTime: "17:30",
    vibes: ["serene", "reflective", "romantic"],
    cuisines: ["Indian"],
  },
];

export const cuisineOptions = [
  "Italian", "Asian", "Indian", "Continental", "Japanese", "Mexican",
  "Cafe", "Street food", "Mediterranean", "Korean", "Thai", "Bakery",
];

export const vibeOptions = [
  "cozy", "lively", "intimate", "outdoors", "rooftop", "fancy",
  "casual", "indoor", "active", "celebratory", "elegant", "fun",
  "serene", "reflective", "spiritual",
];

export const dietaryOptions = ["Vegetarian", "Vegan", "Gluten-free", "Halal", "Jain", "Pescatarian"];

export const transportOptions = [
  { value: "walk", label: "🚶 Walking" },
  { value: "cab", label: "🚖 Cab" },
  { value: "metro", label: "🚇 Metro" },
  { value: "drive", label: "🚗 Own car" },
];

export const weatherOptions = [
  { value: "sunny", label: "☀️ Sunny" },
  { value: "rainy", label: "🌧️ Rainy" },
  { value: "cool", label: "🌬️ Cool" },
  { value: "humid", label: "💧 Humid" },
];

export const occasionOptions = [
  "First date", "Anniversary", "Birthday", "Just because", "Reunion", "Proposal",
];
