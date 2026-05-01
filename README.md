<div align="center">

# 🌸 DateCraft

### AI-powered date planning — budget, mood, time & location

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=flat-square&logo=openai&logoColor=white)
![Google Maps](https://img.shields.io/badge/Google_Maps_API-4285F4?style=flat-square&logo=googlemaps&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-F8BBD0?style=flat-square)

*Plan perfect dates in seconds — not hours.*

[Live Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## ✨ Overview

**DateCraft** is a full-stack AI-powered date planning platform. Users enter their **budget, mood, city, and available time** — and the platform generates a complete romantic itinerary with nearby venue suggestions, live local events, deals, and a weather-aware recommendation engine.

Built with a Cherry Blossom design system (Cormorant + Karla, soft pink gradients, Framer Motion animations) and a clean `src/lib/api.ts` layer you can point at your own Node/Express + MongoDB backend by setting `VITE_API_URL`. Until then, everything runs on realistic mock data — fully demoable out of the box.

---

## 🎯 Key Features

| Feature | Description |
|---|---|
| 🧠 **AI Itinerary Generator** | GPT-4o crafts a personalized date plan based on mood, budget, time slot, city, and weather context |
| 📍 **Smart Location Search** | Google Places autocomplete with venue cards and map preview as you type |
| 🎟️ **Live Events Feed** | Real-time local events matched to your date window — concerts, pop-ups, food festivals |
| 💸 **Deals & Offers** | Curated restaurant and experience deals near you, filtered by budget tier |
| 🌤️ **Weather-Aware AI** | AI factors local forecast into outdoor vs. indoor activity suggestions |
| ❤️ **Saved Plans** | Bookmark itineraries, share with partner, revisit past date plans — with full auth |
| 🎲 **Surprise Me** | One-tap random date generator — AI picks the perfect mood, venue, and vibe for you |
| 🗺️ **Map Integration** | Interactive map view of your entire itinerary with route previews |

---

## 🛠️ Tech Stack

### Frontend
- **React 18 + Vite** — fast dev server, HMR, optimized build
- **TypeScript** — end-to-end type safety
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — smooth page transitions and micro-interactions
- **Shadcn/UI** — accessible component primitives
- **React Router v6** — client-side routing
- **Zustand** — lightweight global state

### AI & APIs
- **OpenAI GPT-4o** — itinerary generation with enriched context prompts
- **Google Maps + Places API** — location autocomplete, venue cards, route maps
- **OpenWeatherMap API** — forecast context injected into AI prompts

### Backend *(bring your own)*
- **Node.js + Express** — REST API server
- **MongoDB + Mongoose** — plans and user data
- **Supabase** — auth (swap for Firebase / custom JWT if preferred)

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm or yarn
- API keys: OpenAI, Google Maps, OpenWeatherMap

### Installation

```bash
git clone https://github.com/avinawshah/datecraft.git
cd datecraft
npm install
```

### Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# Backend
VITE_API_URL=http://localhost:4000        # Your Node/Express backend URL

# Google Maps
VITE_GOOGLE_MAPS_KEY=your_key_here       # Maps + Places API enabled

# OpenAI
VITE_OPENAI_KEY=sk-...                   # Use server-side in production

# Weather
VITE_WEATHER_API_KEY=your_key_here       # OpenWeatherMap API key

# Auth (Supabase)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

> **Note:** If `VITE_API_URL` is not set, the app falls back to realistic mock data — all UI flows are fully interactive without a backend.

### Run

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build
npm run preview    # Preview production build locally
```

---

## 🧠 How the AI Works

DateCraft builds an enriched context object before calling GPT-4o:

```
User Input → Location Autocomplete → Context Builder → GPT-4o → Map + Events Merge → Itinerary
```

**Context sent to AI includes:**
- Mood signal (`romantic`, `adventurous`, `cozy`, `spontaneous`, `luxe`)
- Budget tier and realistic per-stop cost estimates
- Time of day + duration window
- City + neighborhood (from Google Places)
- Current weather forecast (temperature, conditions)
- Day of week + season
- Past saved plan preferences (if logged in)

**Prompt engineering highlights:**
- System role: experienced local date concierge
- Structured JSON output for easy parsing into UI components
- Fallback retries if response doesn't match schema
- Temperature tuned per mood — higher for `spontaneous`, lower for `luxe`

---

## 📡 Backend API Contract

Your Node/Express backend should implement these endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/plan/generate` | Generate AI itinerary from `{ mood, budget, location, startTime, duration }` |
| `GET` | `/api/events?city=&date=` | Fetch live local events for a city + date range |
| `GET` | `/api/deals?city=&budget=` | Return curated restaurant / experience deals |
| `POST` | `/api/plans/save` | Persist a saved itinerary for authenticated user |
| `GET` | `/api/plans/:userId` | Retrieve all saved plans for a user |
| `DELETE` | `/api/plans/:planId` | Delete a saved plan |

### Example: Generate Plan Request

```json
POST /api/plan/generate
{
  "mood": "romantic",
  "budget": 80,
  "location": "Connaught Place, New Delhi",
  "startTime": "19:00",
  "duration": 3,
  "preferences": ["outdoor", "live music", "Italian food"]
}
```

### Example: Generate Plan Response

```json
{
  "title": "A Candlelit Evening in CP",
  "totalCost": 74,
  "stops": [
    {
      "time": "7:00 PM",
      "name": "Unplugged Courtyard",
      "type": "drinks",
      "description": "Start with artisan cocktails under fairy lights",
      "estimatedCost": 18,
      "mapsPlaceId": "ChIJ..."
    },
    {
      "time": "8:15 PM",
      "name": "Sevilla at The Claridges",
      "type": "dinner",
      "description": "Spanish tapas and live flamenco guitar",
      "estimatedCost": 45,
      "mapsPlaceId": "ChIJ..."
    }
  ],
  "tips": "Book the Sevilla table by the courtyard window for the best ambience.",
  "weatherNote": "Light cardigan recommended — 22°C and breezy tonight."
}
```

---

## 📁 Project Structure

```
datecraft/
├── public/
│   └── cherry-blossom.svg
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn base components
│   │   ├── PlanCard.tsx     # Itinerary stop card
│   │   ├── LocationSearch.tsx  # Google Places autocomplete
│   │   ├── MoodPicker.tsx   # Mood selection grid
│   │   └── MapView.tsx      # Interactive map panel
│   ├── pages/
│   │   ├── Landing.tsx      # Hero + 8 sections
│   │   ├── Plan.tsx         # Date planner form + results
│   │   ├── Events.tsx       # Live events feed
│   │   ├── Deals.tsx        # Restaurant deals
│   │   ├── Saved.tsx        # Saved plans dashboard
│   │   └── Auth.tsx         # Login / Register
│   ├── lib/
│   │   ├── api.ts           # API client with mock fallback
│   │   ├── openai.ts        # Prompt builder + AI caller
│   │   ├── maps.ts          # Google Maps helpers
│   │   └── weather.ts       # Weather API client
│   ├── hooks/
│   │   ├── usePlan.ts       # Plan generation hook
│   │   └── useSaved.ts      # Saved plans hook
│   ├── stores/
│   │   ├── planStore.ts     # Current plan state
│   │   └── authStore.ts     # Auth state
│   └── styles/
│       └── cherry-blossom.css  # Design token overrides
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🗺️ Roadmap

### ✅ v1 — Shipped
- [x] Landing page with Hero, Problem, How it Works, Events, Deals, Testimonials, CTA
- [x] Plan generator with mood + budget + time input
- [x] AI itinerary with realistic mock fallback
- [x] Save plan flow + Saved Plans dashboard
- [x] Events and Deals pages
- [x] Login / Register auth pages
- [x] Cherry Blossom design system (Cormorant + Karla)
- [x] Framer Motion page transitions
- [x] Surprise Me button

### 🌸 v2 — Planned
- [ ] Google Places autocomplete with venue preview cards
- [ ] Live weather context injected into AI prompts
- [ ] Partner sharing — send itinerary link to partner
- [ ] Collaborative editing — both partners can tweak the plan
- [ ] Budget slider with real-time cost estimates per stop
- [ ] AI mood detection from free-text input ("I want something low-key but special")
- [ ] Ticketing integration (Eventbrite, Paytm Insider, BookMyShow)
- [ ] Past date history with ratings and notes
- [ ] Progressive Web App (PWA) — offline itinerary access

---

## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# 1. Fork the repo and clone it
git clone https://github.com/YOUR_USERNAME/datecraft.git

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes and commit
git commit -m "feat: add weather-aware AI context"

# 4. Push and open a PR
git push origin feature/your-feature-name
```

Please follow the existing code style and add TypeScript types for new features.

---

## 📄 License

MIT © [Avinaw Shah](https://github.com/avinawshah)

---

<div align="center">

Made with 🌸 and a lot of ☕ by **Avinaw Shah**

*If DateCraft helped you plan something special — give it a ⭐*

</div>
