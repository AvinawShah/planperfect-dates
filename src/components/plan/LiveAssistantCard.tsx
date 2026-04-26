import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Radio, RefreshCw, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { adaptPlanLive, type LiveAdaptation, type Plan } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Props {
  plan: Plan;
  onApplyUpdatedPlan?: (updated: Plan) => void;
}

const moods: { v: "tired" | "excited" | "neutral"; emoji: string; label: string }[] = [
  { v: "excited", emoji: "🤩", label: "Excited" },
  { v: "neutral", emoji: "🙂", label: "Neutral" },
  { v: "tired", emoji: "😴", label: "Tired" },
];
const weathers: { v: "sunny" | "rainy" | "cloudy"; emoji: string; label: string }[] = [
  { v: "sunny", emoji: "☀️", label: "Sunny" },
  { v: "cloudy", emoji: "⛅", label: "Cloudy" },
  { v: "rainy", emoji: "🌧️", label: "Rainy" },
];
const crowds: { v: "low" | "medium" | "high"; emoji: string; label: string }[] = [
  { v: "low", emoji: "🟢", label: "Low" },
  { v: "medium", emoji: "🟡", label: "Medium" },
  { v: "high", emoji: "🔴", label: "High" },
];

function Pill<T extends string>({
  options, value, onChange,
}: { options: { v: T; emoji: string; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
            value === o.v
              ? "border-transparent bg-gradient-rose text-primary-foreground shadow-pop"
              : "border-border bg-card hover:border-primary/40 hover:bg-primary-soft/30"
          }`}
        >
          <span className="mr-1">{o.emoji}</span>{o.label}
        </button>
      ))}
    </div>
  );
}

const LiveAssistantCard = ({ plan, onApplyUpdatedPlan }: Props) => {
  const [runningLate, setRunningLate] = useState(false);
  const [userMood, setUserMood] = useState<"tired" | "excited" | "neutral">("neutral");
  const [weather, setWeather] = useState<"sunny" | "rainy" | "cloudy">("sunny");
  const [crowdLevel, setCrowdLevel] = useState<"low" | "medium" | "high">("low");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveAdaptation | null>(null);

  async function run() {
    setLoading(true); setResult(null);
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const r = await adaptPlanLive(plan, {
        currentTime, runningLate, userMood, weather, crowdLevel,
        city: plan.location,
      });
      setResult(r);
      if (r.status === "unchanged") toast.success("All good — no changes needed ✨");
      else toast.success("Plan adapted to your vibe 💫");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Couldn't adapt the plan.");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdated() {
    if (!result) return;
    const total = result.updatedPlan.reduce((s, i) => s + (i.cost || 0), 0);
    onApplyUpdatedPlan?.({ ...plan, itinerary: result.updatedPlan, totalCost: total });
    toast.success("Updated plan applied 💖");
  }


  return (
    <section className="rounded-3xl bg-card border border-primary/10 shadow-card overflow-hidden">
      <header className="relative bg-gradient-aurora animate-gradient-pan p-6 md:p-7">
        <span className="pointer-events-none absolute top-3 right-5 text-xl animate-float-slow">⚡</span>
        <p className="text-xs uppercase tracking-widest text-white/90 flex items-center gap-2 font-semibold">
          <Radio className="h-3.5 w-3.5" /> Live AI assistant 🛰️
        </p>
        <h3 className="mt-1 font-serif text-2xl md:text-3xl text-white drop-shadow-sm">
          Adapt your plan in real time
        </h3>
        <p className="mt-1 text-white/85 text-sm">
          Running late? Sudden rain? Let AI smartly tweak your date 💫
        </p>
      </header>

      <div className="p-6 md:p-7 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2 block">Your mood</label>
            <Pill options={moods} value={userMood} onChange={(v) => setUserMood(v)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2 block">Weather</label>
            <Pill options={weathers} value={weather} onChange={(v) => setWeather(v)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2 block">Crowd level</label>
            <Pill options={crowds} value={crowdLevel} onChange={(v) => setCrowdLevel(v)} />
          </div>
          <div className="flex items-end">
            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 cursor-pointer transition w-full ${
              runningLate ? "border-transparent bg-gradient-rose text-primary-foreground shadow-pop" : "border-border bg-card hover:border-primary/40"
            }`}>
              <input type="checkbox" className="sr-only" checked={runningLate} onChange={(e) => setRunningLate(e.target.checked)} />
              <span className="text-xl">⏱️</span>
              <span className="text-sm font-medium">Running late</span>
            </label>
          </div>
        </div>

        <Button onClick={run} disabled={loading} variant="hero" size="lg" className="w-full shadow-pop">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap />}
          {loading ? "Reading the vibe…" : "✨ Adapt my date now"}
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-2xl bg-primary-soft/50 border border-primary/20 p-4">
                <p className="text-sm flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{result.assistantMessage}</span>
                </p>
              </div>

              {result.changes.length > 0 && (
                <ul className="space-y-2">
                  {result.changes.map((c, i) => {
                    const tone = c.type === "skip" ? "bg-amber-100 text-amber-900 border-amber-200"
                      : c.type === "replace" ? "bg-rose-100 text-rose-900 border-rose-200"
                      : "bg-sky-100 text-sky-900 border-sky-200";
                    const emoji = c.type === "skip" ? "⏭️" : c.type === "replace" ? "🔄" : "🎚️";
                    return (
                      <li key={i} className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full border px-2 py-0.5 ${tone}`}>
                            {emoji} {c.type}
                          </span>
                        </div>
                        <p className="text-sm"><span className="text-muted-foreground line-through">{c.original}</span> → <span className="font-medium">{c.new}</span></p>
                        <p className="mt-1 text-xs text-muted-foreground">{c.reason}</p>
                      </li>
                    );
                  })}
                </ul>
              )}

              {result.status === "updated" && (
                <div className="rounded-2xl border border-primary/15 bg-card p-4">
                  <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">📋 Updated timeline</p>
                  <ol className="space-y-2">
                    {result.updatedPlan.map((s, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-lg">{s.emoji || "📍"}</span>
                        <span className="text-muted-foreground tabular-nums w-16">{s.time}</span>
                        <span className="flex-1 truncate">{s.activity} · <span className="text-muted-foreground">{s.place}</span></span>
                        <span className="font-medium text-primary">{plan.currency}{s.cost}</span>
                      </li>
                    ))}
                  </ol>
                  {onApplyUpdatedPlan && (
                    <Button onClick={applyUpdated} variant="soft" size="sm" className="mt-4 w-full">
                      <RefreshCw className="h-4 w-4" /> Apply to my itinerary
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default LiveAssistantCard;
