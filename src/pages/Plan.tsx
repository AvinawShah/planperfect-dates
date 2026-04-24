import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Loader2, Sparkles, Wallet, Clock, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ItineraryView from "@/components/ItineraryView";
import LocationAutocomplete from "@/components/plan/LocationAutocomplete";
import TemplateGallery from "@/components/plan/TemplateGallery";
import ChipSelect from "@/components/plan/ChipSelect";
import AIVibeCard from "@/components/plan/AIVibeCard";
import NearbyMap from "@/components/plan/NearbyMap";
import NearbyCafes from "@/components/plan/NearbyCafes";
import { Button } from "@/components/ui/button";
import { generatePlan, predictVibe, savePlan, surpriseMe, type Mood, type Plan, type VibePrediction } from "@/lib/api";
import { cityAreas, type AreaSuggestion } from "@/lib/locations";
import {
  cuisineOptions,
  vibeOptions,
  dietaryOptions,
  transportOptions,
  weatherOptions,
  occasionOptions,
  type DateTemplate,
} from "@/lib/templates";
import { toast } from "sonner";

const moods: { value: Mood; label: string; emoji: string }[] = [
  { value: "romantic", label: "Romantic", emoji: "💖" },
  { value: "foodie", label: "Foodie", emoji: "🍝" },
  { value: "playful", label: "Playful", emoji: "🎉" },
  { value: "adventurous", label: "Adventurous", emoji: "⛰️" },
  { value: "chill", label: "Chill", emoji: "🌙" },
  { value: "cultural", label: "Cultural", emoji: "🎭" },
  { value: "spiritual", label: "Spiritual", emoji: "🛕" },
];

const PlanPage = () => {
  const [params] = useSearchParams();

  // Core inputs
  const [budget, setBudget] = useState(1500);
  const [mood, setMood] = useState<Mood>("romantic");
  const [startTime, setStartTime] = useState("17:30");
  const [duration, setDuration] = useState(4);
  const [location, setLocation] = useState<AreaSuggestion>(cityAreas[0]);

  // Diverse inputs
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [transport, setTransport] = useState<string[]>([]);
  const [weather, setWeather] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Result
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [saved, setSaved] = useState(false);

  // AI prediction
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<VibePrediction | null>(null);
  const predictTimer = useRef<number | null>(null);

  useEffect(() => {
    if (params.get("surprise") === "1") void doSurprise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced AI predict whenever key inputs change
  const predictKey = useMemo(
    () => JSON.stringify({ budget, startTime, duration, city: location.city, area: location.area, cuisines, vibes, transport, weather, occasion }),
    [budget, startTime, duration, location, cuisines, vibes, transport, weather, occasion],
  );

  useEffect(() => {
    if (predictTimer.current) window.clearTimeout(predictTimer.current);
    const myKey = predictKey;
    predictTimer.current = window.setTimeout(async () => {
      setPredicting(true);
      const p = await predictVibe({
        budget,
        startTime,
        durationHours: duration,
        city: location.city,
        area: location.area,
        cuisines,
        vibes,
        transport: transport[0],
        dietary,
        weather: weather[0],
        occasion: occasion[0],
      });
      // Skip if inputs changed while we were waiting
      if (myKey !== predictKey) return;
      if (p) setPrediction(p);
      setPredicting(false);
    }, 1500);
    return () => { if (predictTimer.current) window.clearTimeout(predictTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictKey]);

  function applyTemplate(t: DateTemplate) {
    setBudget(t.budget);
    setMood(t.mood);
    setStartTime(t.startTime);
    setDuration(t.durationHours);
    if (t.vibes) setVibes(t.vibes);
    if (t.cuisines) setCuisines(t.cuisines);
    if (t.weather) setWeather([t.weather]);
    if (t.transport) setTransport([t.transport]);
    if (t.occasion) setOccasion([t.occasion]);
    if (t.area) {
      const match = cityAreas.find((a) => a.area.toLowerCase() === t.area!.toLowerCase());
      if (match) setLocation(match);
    }
    setShowAdvanced(true);
    toast.success(`Loaded "${t.title}" — tweak and generate ✨`);
  }

  async function doSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true); setPlan(null); setSaved(false);
    try {
      const p = await generatePlan({
        budget, currency: "₹", mood, startTime, durationHours: duration,
        location: { lat: location.lat, lng: location.lng, label: location.label },
        city: location.city, area: location.area,
        cuisines, vibes, dietary,
        transport: transport[0],
        weather: weather[0],
        occasion: occasion[0],
      });
      setPlan(p);
    } catch {
      toast.error("Couldn't generate a plan. Try again.");
    } finally { setLoading(false); }
  }

  async function doSurprise() {
    setLoading(true); setPlan(null); setSaved(false);
    try { setPlan(await surpriseMe()); }
    catch { toast.error("Surprise failed. Try again."); }
    finally { setLoading(false); }
  }

  function handleSave() {
    if (!plan) return;
    savePlan(plan); setSaved(true); toast.success("Plan saved 💖");
  }

  async function handleShare() {
    if (!plan) return;
    const text = `${plan.title} — ${plan.location}\n\n` +
      plan.itinerary.map((i) => `${i.time} ${i.emoji ?? ""} ${i.activity} @ ${i.place} (${plan.currency}${i.cost})`).join("\n") +
      `\n\nTotal ${plan.currency}${plan.totalCost} · planned with DateCraft 💖`;
    if (navigator.share) {
      try { await navigator.share({ title: plan.title, text }); return; } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(text); toast.success("Plan copied to clipboard"); }
    catch { toast.error("Couldn't share — copy manually."); }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-warm">
      <Navbar />
      <main className="flex-1">
        <section className="container-narrow pt-12 pb-6">
          <p className="text-sm tracking-widest uppercase text-primary mb-3">Date planner</p>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight">Tell us the vibe.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">Pick a template, tweak a few details, and let AI craft a real-place itinerary tailored to you.</p>
        </section>

        <section className="container-narrow pb-8">
          <TemplateGallery onPick={applyTemplate} />
        </section>

        <section className="container-narrow grid lg:grid-cols-[440px_1fr] gap-10 pb-16">
          {/* Form */}
          <form onSubmit={doSubmit} className="rounded-3xl bg-card border border-primary/10 p-6 md:p-7 shadow-card h-fit space-y-6">
            {/* Location */}
            <LocationAutocomplete value={location} onChange={setLocation} />

            {/* Budget */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Wallet className="h-4 w-4 text-primary" /> Budget
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={300} max={6000} step={100}
                  value={budget} onChange={(e) => setBudget(+e.target.value)}
                  className="flex-1 accent-[hsl(var(--primary))]"
                />
                <span className="font-medium tabular-nums w-20 text-right">₹{budget}</span>
              </div>
            </div>

            {/* Mood */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Heart className="h-4 w-4 text-primary" /> Mood
              </label>
              <div className="grid grid-cols-3 gap-2">
                {moods.map((m) => (
                  <button
                    key={m.value} type="button" onClick={() => setMood(m.value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm transition-all ${
                      mood === m.value
                        ? "border-primary bg-primary-soft text-primary shadow-soft"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="text-xl">{m.emoji}</div>
                    <div className="mt-0.5 text-xs">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Clock className="h-4 w-4 text-primary" /> Start
                </label>
                <input
                  type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Duration</label>
                <select
                  value={duration} onChange={(e) => setDuration(+e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                >
                  {[2, 3, 4, 5, 6, 8].map((h) => <option key={h} value={h}>{h} hrs</option>)}
                </select>
              </div>
            </div>

            {/* AI Vibe Card */}
            <AIVibeCard
              loading={predicting}
              prediction={prediction}
              currentMood={mood}
              onApplyMood={setMood}
              onApplyVibes={(v) => setVibes(Array.from(new Set([...vibes, ...v])))}
            />

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="w-full flex items-center justify-between text-sm font-medium text-foreground/80 hover:text-primary transition"
            >
              <span>More details for smarter suggestions</span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-5 overflow-hidden"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Vibes</label>
                  <ChipSelect options={vibeOptions} value={vibes} onChange={setVibes} size="sm" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Cuisine</label>
                  <ChipSelect options={cuisineOptions} value={cuisines} onChange={setCuisines} size="sm" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Dietary</label>
                  <ChipSelect options={dietaryOptions} value={dietary} onChange={setDietary} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Transport</label>
                    <ChipSelect options={transportOptions} value={transport} onChange={setTransport} multi={false} size="sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Weather</label>
                    <ChipSelect options={weatherOptions} value={weather} onChange={setWeather} multi={false} size="sm" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Occasion</label>
                  <ChipSelect options={occasionOptions} value={occasion} onChange={setOccasion} multi={false} size="sm" />
                </div>
              </motion.div>
            )}

            <div className="space-y-2 pt-2">
              <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles />}
                {loading ? "Crafting your date…" : "Generate plan"}
              </Button>
              <Button type="button" variant="outline" size="lg" disabled={loading} className="w-full" onClick={doSurprise}>
                ✨ Surprise me
              </Button>
            </div>
          </form>

          {/* Result */}
          <div>
            {loading && <SkeletonPlan />}
            {!loading && plan && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <ItineraryView plan={plan} onSave={handleSave} onShare={handleShare} saved={saved} />
              </motion.div>
            )}
            {!loading && !plan && <EmptyState />}
          </div>
        </section>

        {/* Cafés near you — quick ranked list */}
        <section className="container-narrow pb-12">
          <div className="mb-4">
            <p className="text-sm tracking-widest uppercase text-primary mb-2">Cafés for you</p>
            <h2 className="font-serif text-2xl md:text-3xl">Closest cafés right now</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ranked by distance from <span className="text-foreground">{location.label}</span> — perfect for a coffee-first date.</p>
          </div>
          <NearbyCafes lat={location.lat} lng={location.lng} label={location.label} />
        </section>

        {/* Nearby map — real OpenStreetMap data, no API key */}
        <section className="container-narrow pb-16">
          <div className="mb-4">
            <p className="text-sm tracking-widest uppercase text-primary mb-2">Explore the area</p>
            <h2 className="font-serif text-2xl md:text-3xl">Hangout spots near you</h2>
            <p className="mt-1 text-sm text-muted-foreground">Real cafés, bars, restaurants, parks, temples & cinemas around <span className="text-foreground">{location.label}</span>.</p>
          </div>
          <NearbyMap lat={location.lat} lng={location.lng} label={location.label} />
        </section>
      </main>
      <Footer />
    </div>
  );
};

const SkeletonPlan = () => (
  <div className="rounded-3xl border border-primary/10 bg-card p-8 shadow-card overflow-hidden">
    <div className="h-6 w-40 rounded animate-shimmer mb-3" />
    <div className="h-10 w-3/4 rounded animate-shimmer mb-8" />
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-4 border-t border-border/50">
        <div className="h-12 w-12 rounded-full animate-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded animate-shimmer" />
          <div className="h-5 w-2/3 rounded animate-shimmer" />
        </div>
        <div className="h-5 w-16 rounded animate-shimmer" />
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="rounded-3xl border border-dashed border-primary/30 bg-card/50 p-12 text-center">
    <div className="mx-auto h-16 w-16 rounded-full bg-gradient-rose flex items-center justify-center text-3xl shadow-soft">🌸</div>
    <h3 className="mt-5 font-serif text-2xl">Your itinerary will appear here.</h3>
    <p className="mt-2 text-muted-foreground max-w-sm mx-auto">Pick a template above or tweak the form. AI will suggest a vibe as you type — then craft a full plan with real places.</p>
  </div>
);

export default PlanPage;
