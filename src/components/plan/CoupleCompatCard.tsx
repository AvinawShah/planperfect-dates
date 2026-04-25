import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, Sparkles, Users, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  generateCoupleCompat,
  type CoupleCompat,
  type CoupleProfile,
  type Mood,
} from "@/lib/api";

interface Props {
  city: string;
  area?: string;
  startTime?: string;
  durationHours?: number;
}

const MOODS: { value: Mood | ""; label: string; emoji: string }[] = [
  { value: "", label: "—", emoji: "·" },
  { value: "romantic", label: "Romantic", emoji: "💖" },
  { value: "foodie", label: "Foodie", emoji: "🍝" },
  { value: "playful", label: "Playful", emoji: "🎉" },
  { value: "adventurous", label: "Adventurous", emoji: "⛰️" },
  { value: "chill", label: "Chill", emoji: "🌙" },
  { value: "cultural", label: "Cultural", emoji: "🎭" },
  { value: "spiritual", label: "Spiritual", emoji: "🛕" },
];

const EMPTY: CoupleProfile = {
  name: "",
  personality: "",
  preferences: "",
  budget: 1500,
  mood: "",
  interests: [],
  dislikes: [],
};

function TagInput({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft("");
  }
  return (
    <div>
      <label className="text-xs font-medium text-foreground/80 mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {values.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-primary-soft/60 text-primary-foreground/90 px-2 py-0.5 text-xs"
          >
            {t}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== t))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-border px-2 py-1.5 text-xs hover:border-primary hover:text-primary transition"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ProfileForm({
  title,
  emoji,
  value,
  onChange,
}: {
  title: string;
  emoji: string;
  value: CoupleProfile;
  onChange: (p: CoupleProfile) => void;
}) {
  function set<K extends keyof CoupleProfile>(k: K, v: CoupleProfile[K]) {
    onChange({ ...value, [k]: v });
  }
  return (
    <div className="rounded-2xl border border-primary/15 bg-card/80 backdrop-blur p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <h4 className="font-serif text-lg">{title}</h4>
      </div>
      <input
        value={value.name || ""}
        onChange={(e) => set("name", e.target.value)}
        placeholder="Name (optional)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={value.personality || ""}
          onChange={(e) => set("personality", e.target.value as CoupleProfile["personality"])}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Personality…</option>
          <option value="introvert">Introvert 🌙</option>
          <option value="extrovert">Extrovert 🎉</option>
          <option value="mixed">Mixed 🌗</option>
        </select>
        <select
          value={value.mood || ""}
          onChange={(e) => set("mood", e.target.value as Mood | "")}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none"
        >
          {MOODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.emoji} {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground/80 mb-1 block">
          Budget · ₹{value.budget ?? 0}
        </label>
        <input
          type="range"
          min={300}
          max={6000}
          step={100}
          value={value.budget ?? 1500}
          onChange={(e) => set("budget", +e.target.value)}
          className="w-full accent-[hsl(var(--primary))]"
        />
      </div>
      <TagInput
        label="Interests"
        values={value.interests || []}
        placeholder="e.g. coffee, books, live music"
        onChange={(v) => set("interests", v)}
      />
      <TagInput
        label="Dislikes"
        values={value.dislikes || []}
        placeholder="e.g. crowds, loud bars"
        onChange={(v) => set("dislikes", v)}
      />
      <textarea
        value={value.preferences || ""}
        onChange={(e) => set("preferences", e.target.value)}
        placeholder="Food / activities / vibe in one line"
        rows={2}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none"
      />
    </div>
  );
}

const stepEmoji: Record<string, string> = {
  "User A": "💙",
  "User B": "💗",
  Both: "💖",
};

const CoupleCompatCard = ({ city, area, startTime, durationHours }: Props) => {
  const [userA, setUserA] = useState<CoupleProfile>({ ...EMPTY });
  const [userB, setUserB] = useState<CoupleProfile>({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoupleCompat | null>(null);

  async function run() {
    setLoading(true);
    try {
      const data = await generateCoupleCompat({
        city,
        area,
        startTime,
        durationHours,
        userA,
        userB,
      });
      setResult(data);
      toast.success("Compatibility plan ready 💞");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Couldn't generate plan");
    } finally {
      setLoading(false);
    }
  }

  const scoreNum = result ? parseInt(result.compatibility.score) || 0 : 0;

  return (
    <section className="container-narrow pb-16">
      <div className="mb-5">
        <p className="text-sm tracking-widest uppercase text-primary mb-2 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Couple compatibility
        </p>
        <h2 className="font-serif text-2xl md:text-3xl">
          Plan a date that works for <span className="gradient-text italic">both of you</span> 💞
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop in both profiles — AI finds overlaps, balances differences, and crafts a shared plan within your combined budget. ✨
        </p>
      </div>

      <div className="rounded-3xl bg-gradient-blossom border border-primary/15 p-5 md:p-7 shadow-card">
        <div className="grid md:grid-cols-2 gap-4">
          <ProfileForm title="User A" emoji="💙" value={userA} onChange={setUserA} />
          <ProfileForm title="User B" emoji="💗" value={userB} onChange={setUserB} />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            📍 {area ? `${area}, ${city}` : city} · combined budget ₹{(userA.budget || 0) + (userB.budget || 0)}
          </p>
          <Button onClick={run} disabled={loading} variant="hero" size="lg" className="shadow-pop">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles />}
            {loading ? "Matching vibes…" : result ? "Re-analyze 💞" : "💞 Find our date"}
          </Button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6 space-y-5"
            >
              {/* Compatibility */}
              <div className="rounded-2xl bg-card border border-primary/15 p-5">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeDasharray={`${(scoreNum / 100) * 100.5} 100.5`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-serif text-lg">
                      {result.compatibility.score}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-serif text-xl flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" /> Compatibility
                    </div>
                    <p className="text-sm text-foreground/80 mt-1">{result.compatibility.summary}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl bg-primary-soft/40 p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-primary mb-1.5">
                      ✨ Common ground
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.compatibility.commonInterests.map((c) => (
                        <span key={c} className="text-xs rounded-full bg-card px-2 py-0.5 border border-primary/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary/40 p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-foreground/70 mb-1.5">
                      🌗 Differences
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.compatibility.differences.map((c) => (
                        <span key={c} className="text-xs rounded-full bg-card px-2 py-0.5 border border-border">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan */}
              <div className="rounded-2xl bg-card border border-primary/15 p-5">
                <h3 className="font-serif text-xl mb-3 flex items-center gap-2">
                  📋 Balanced itinerary
                </h3>
                <ol className="space-y-3">
                  {result.plan.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-xl border border-border/60 bg-background/40 p-3 hover:border-primary/40 transition"
                    >
                      <div className="text-2xl">{step.emoji || stepEmoji[step.chosenFor]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-primary">{step.time}</span>
                          <span
                            className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              step.chosenFor === "Both"
                                ? "bg-primary-soft text-primary-foreground"
                                : step.chosenFor === "User A"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-pink-100 text-pink-700"
                            }`}
                          >
                            {stepEmoji[step.chosenFor]} {step.chosenFor}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">₹{step.cost}</span>
                        </div>
                        <div className="mt-0.5 font-medium">{step.activity}</div>
                        <div className="text-xs text-muted-foreground">📍 {step.place}</div>
                        <div className="text-xs text-foreground/70 italic mt-1">💡 {step.reason}</div>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 text-right text-sm font-medium">
                  Total · ₹{result.plan.reduce((s, x) => s + (x.cost || 0), 0)}
                </div>
              </div>

              {/* Insight + fun */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gradient-rose/10 border border-primary/15 p-4">
                  <div className="text-xs uppercase tracking-wide text-primary mb-1">💡 Insight</div>
                  <p className="text-sm text-foreground/85">{result.insight}</p>
                </div>
                <div className="rounded-2xl bg-gradient-aurora/10 border border-primary/15 p-4">
                  <div className="text-xs uppercase tracking-wide text-primary mb-1">😄 Fun note</div>
                  <p className="text-sm text-foreground/85">{result.funNote}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default CoupleCompatCard;
