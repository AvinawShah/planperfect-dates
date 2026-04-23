import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Loader2, MapPin, Sparkles, Wallet, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ItineraryView from "@/components/ItineraryView";
import { Button } from "@/components/ui/button";
import { generatePlan, savePlan, surpriseMe, type Mood, type Plan } from "@/lib/api";
import { toast } from "sonner";

const moods: { value: Mood; label: string; emoji: string }[] = [
  { value: "romantic", label: "Romantic", emoji: "💖" },
  { value: "foodie", label: "Foodie", emoji: "🍝" },
  { value: "playful", label: "Playful", emoji: "🎉" },
  { value: "adventurous", label: "Adventurous", emoji: "⛰️" },
  { value: "chill", label: "Chill", emoji: "🌙" },
  { value: "cultural", label: "Cultural", emoji: "🎭" },
];

const cityPresets = [
  { label: "Bengaluru", lat: 12.97, lng: 77.59 },
  { label: "Mumbai", lat: 19.07, lng: 72.87 },
  { label: "Delhi", lat: 28.61, lng: 77.21 },
  { label: "Goa", lat: 15.49, lng: 73.82 },
];

const PlanPage = () => {
  const [params] = useSearchParams();
  const [budget, setBudget] = useState(1500);
  const [mood, setMood] = useState<Mood>("romantic");
  const [startTime, setStartTime] = useState("17:30");
  const [duration, setDuration] = useState(4);
  const [city, setCity] = useState(cityPresets[0]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (params.get("surprise") === "1") void doSurprise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true); setPlan(null); setSaved(false);
    try {
      const p = await generatePlan({
        budget, currency: "₹", mood, startTime, durationHours: duration,
        location: { lat: city.lat, lng: city.lng, label: city.label },
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
        <section className="container-narrow pt-12 pb-8">
          <p className="text-sm tracking-widest uppercase text-primary mb-3">Date planner</p>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight">Tell us the vibe.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">A few quick choices and we'll craft a complete itinerary with real places.</p>
        </section>

        <section className="container-narrow grid lg:grid-cols-[420px_1fr] gap-10 pb-16">
          {/* Form */}
          <form onSubmit={doSubmit} className="rounded-3xl bg-card border border-primary/10 p-7 shadow-card h-fit">
            <div className="space-y-6">
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
                    {[2, 3, 4, 5, 6].map((h) => <option key={h} value={h}>{h} hrs</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <MapPin className="h-4 w-4 text-primary" /> City
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {cityPresets.map((c) => (
                    <button
                      key={c.label} type="button" onClick={() => setCity(c)}
                      className={`rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        city.label === c.label
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >{c.label}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles />}
                  {loading ? "Crafting your date…" : "Generate plan"}
                </Button>
                <Button type="button" variant="outline" size="lg" disabled={loading} className="w-full" onClick={doSurprise}>
                  ✨ Surprise me
                </Button>
              </div>
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
    <p className="mt-2 text-muted-foreground max-w-sm mx-auto">Set a budget and mood, then hit Generate. Or just tap Surprise me — we promise it's good.</p>
  </div>
);

export default PlanPage;
