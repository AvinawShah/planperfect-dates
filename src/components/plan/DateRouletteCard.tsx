import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { spinDateRoulette, type RouletteResult } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Props {
  budget: number;
  mood?: string;
  city?: string;
  area?: string;
}

const funBadge = (level: "low" | "medium" | "high") => {
  if (level === "high") return { cls: "bg-rose-100 text-rose-900 border-rose-200", label: "🔥 High fun" };
  if (level === "medium") return { cls: "bg-amber-100 text-amber-900 border-amber-200", label: "✨ Med fun" };
  return { cls: "bg-sky-100 text-sky-900 border-sky-200", label: "🌿 Easy" };
};

const DateRouletteCard = ({ budget, mood, city, area }: Props) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouletteResult | null>(null);
  const [spinning, setSpinning] = useState(false);

  async function spin() {
    setLoading(true);
    setSpinning(true);
    try {
      const r = await spinDateRoulette({ budget, mood, city, area });
      // Let the wheel finish a beat for delight
      await new Promise((res) => setTimeout(res, 700));
      setResult(r);
      toast.success("🎲 The dice have spoken!");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Couldn't spin. Try again.");
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }

  return (
    <section className="rounded-3xl bg-card border border-primary/10 shadow-card overflow-hidden">
      <header className="relative bg-gradient-aurora animate-gradient-pan p-6 md:p-7">
        <span className="pointer-events-none absolute top-3 right-5 text-xl animate-float-slow">🎲</span>
        <span className="pointer-events-none absolute bottom-3 left-5 text-lg animate-float-slow" style={{ animationDelay: "1.2s" }}>🎰</span>
        <p className="text-xs uppercase tracking-widest text-white/90 flex items-center gap-2 font-semibold">
          <Dices className="h-3.5 w-3.5" /> Date Roulette 🎲
        </p>
        <h3 className="mt-1 font-serif text-2xl md:text-3xl text-white drop-shadow-sm">
          Let fate plan tonight
        </h3>
        <p className="mt-1 text-white/85 text-sm">
          One spin → activity + food + a playful challenge ✨
        </p>
      </header>

      <div className="p-6 md:p-7 space-y-5">
        {/* Wheel button */}
        <div className="flex flex-col items-center gap-4 py-4">
          <motion.button
            type="button"
            onClick={spin}
            disabled={loading}
            className="relative h-32 w-32 rounded-full bg-gradient-rose shadow-glow flex items-center justify-center text-5xl select-none disabled:opacity-80"
            animate={spinning ? { rotate: 1080 } : { rotate: 0 }}
            transition={spinning ? { duration: 1.2, ease: "easeOut" } : { duration: 0.3 }}
            whileHover={!loading ? { scale: 1.05 } : undefined}
            whileTap={!loading ? { scale: 0.95 } : undefined}
            aria-label="Spin the date roulette"
          >
            {loading ? <Loader2 className="h-10 w-10 animate-spin text-white" /> : <span>🎲</span>}
            <span className="absolute -top-2 -right-2 text-2xl animate-wiggle">✨</span>
          </motion.button>
          <p className="text-xs text-muted-foreground text-center">
            Budget: <span className="text-foreground font-semibold">₹{budget}</span> · Mood: <span className="text-foreground font-semibold capitalize">{mood || "fun"}</span>
            {city && <> · 📍 <span className="text-foreground font-semibold">{area || city}</span></>}
          </p>
          <Button onClick={spin} disabled={loading} variant="hero" size="lg" className="shadow-pop">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Dices />}
            {loading ? "Spinning…" : result ? "🎲 Spin again" : "🎲 Spin the roulette"}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.assistantNote + result.totalEstimatedCost}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Assistant note */}
              <div className="rounded-2xl bg-primary-soft/50 border border-primary/20 p-4 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/90">{result.assistantNote}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">Vibe: {result.vibe}</p>
                </div>
              </div>

              {/* Three cards */}
              <div className="grid sm:grid-cols-3 gap-3">
                {/* Activity */}
                <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-4">
                  <div className="text-3xl mb-2">{result.roulette.activity.emoji}</div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1">Activity</p>
                  <h4 className="font-serif text-lg leading-tight">{result.roulette.activity.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1.5">{result.roulette.activity.description}</p>
                  <p className="mt-3 text-sm font-semibold text-rose-700">₹{result.roulette.activity.estimatedCost}</p>
                </div>

                {/* Food */}
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                  <div className="text-3xl mb-2">{result.roulette.food.emoji}</div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Food · {result.roulette.food.type}</p>
                  <h4 className="font-serif text-lg leading-tight">{result.roulette.food.suggestion}</h4>
                  <p className="mt-3 text-sm font-semibold text-amber-700">₹{result.roulette.food.estimatedCost}</p>
                </div>

                {/* Challenge */}
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl mb-2">{result.roulette.challenge.emoji}</div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full border px-2 py-0.5 ${funBadge(result.roulette.challenge.funLevel).cls}`}>
                      {funBadge(result.roulette.challenge.funLevel).label}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 mb-1">Surprise challenge</p>
                  <h4 className="font-serif text-lg leading-tight">{result.roulette.challenge.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1.5">{result.roulette.challenge.instruction}</p>
                </div>
              </div>

              {/* Total */}
              <div className="rounded-2xl border border-primary/15 bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Total spend</p>
                  <p className="font-serif text-2xl">₹{result.totalEstimatedCost} <span className="text-sm text-muted-foreground font-sans">/ ₹{budget}</span></p>
                </div>
                <div className={`text-xs font-semibold rounded-full px-3 py-1.5 border ${
                  result.totalEstimatedCost <= budget
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-rose-100 text-rose-800 border-rose-200"
                }`}>
                  {result.totalEstimatedCost <= budget ? "✅ Within budget" : "⚠️ Over budget"}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default DateRouletteCard;
