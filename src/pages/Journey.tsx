import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Map as MapIcon,
  Clock,
  Sparkles,
  Play,
  Pause,
  Plus,
  Trash2,
  Heart,
  BookOpen,
  Wand2,
  X,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  generateJourneyStory,
  getJourneyStops,
  saveJourneyStops,
  type JourneyStopInput,
  type JourneyStory,
} from "@/lib/api";
import { toast } from "sonner";

/* ---------- demo seed ---------- */
const DEMO_STOPS: JourneyStopInput[] = [
  { place: "Third Wave Coffee, Indiranagar", date: "2025-08-12", mood: "nervous", activity: "Coffee", notes: "First date, stayed 3 hours" },
  { place: "Cubbon Park", date: "2025-09-02", mood: "playful", activity: "Walk", notes: "Got caught in the rain" },
  { place: "Toit Brewpub", date: "2025-10-14", mood: "fun", activity: "Dinner & beer", notes: "She told me about her grandmother" },
  { place: "Nandi Hills sunrise", date: "2025-11-29", mood: "romantic", activity: "Sunrise drive", notes: "We didn't say much" },
  { place: "Corner House, Koramangala", date: "2026-02-14", mood: "in love", activity: "Dessert", notes: "Death by Chocolate" },
];

/* ---------- deterministic position layout for the stylized map ---------- */
function layoutPositions(n: number, w: number, h: number) {
  // hand-tuned wandering path so it never looks gridded
  const padX = 90;
  const padY = 110;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = padX + t * innerW;
    // sinusoid + small jitter from index for natural meander
    const wobble =
      Math.sin(t * Math.PI * 2.2 + (i % 3)) * (innerH / 2.4) +
      Math.cos(t * Math.PI * 1.4) * (innerH / 6);
    const y = padY + innerH / 2 + wobble;
    return { x, y };
  });
}

/* ---------- smooth catmull-rom-ish curve through points ---------- */
function pathBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.18;
  return `M ${a.x} ${a.y} Q ${mx} ${cy} ${b.x} ${b.y}`;
}

const importanceRadius: Record<"low" | "medium" | "high", number> = {
  low: 18,
  medium: 24,
  high: 32,
};

const Journey = () => {
  const [stops, setStops] = useState<JourneyStopInput[]>(() => {
    const saved = getJourneyStops();
    return saved.length ? saved : DEMO_STOPS;
  });
  const [story, setStory] = useState<JourneyStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"map" | "timeline" | "story">("map");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // form
  const [newPlace, setNewPlace] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    saveJourneyStops(stops);
  }, [stops]);

  const W = 1100;
  const H = 560;
  const positions = useMemo(() => layoutPositions(stops.length, W, H), [stops.length]);

  /* ---------- AI generate ---------- */
  async function handleGenerate() {
    if (stops.length < 2) {
      toast.error("Add at least 2 places to map your journey.");
      return;
    }
    setLoading(true);
    try {
      const s = await generateJourneyStory({ stops, city: "Bengaluru" });
      setStory(s);
      toast.success("Your journey came to life ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't weave your story.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- play journey ---------- */
  useEffect(() => {
    if (!playing) return;
    setActiveIdx(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= stops.length) {
        setPlaying(false);
        clearInterval(id);
        return;
      }
      setActiveIdx(i);
    }, 1400);
    return () => clearInterval(id);
  }, [playing, stops.length]);

  function addStop() {
    if (!newPlace.trim()) return;
    setStops((s) => [...s, { place: newPlace.trim(), date: newDate || undefined, notes: newNotes || undefined }]);
    setNewPlace(""); setNewDate(""); setNewNotes("");
    toast.success("Added to your map");
  }

  function removeStop(i: number) {
    setStops((s) => s.filter((_, k) => k !== i));
    setStory(null);
  }

  /* ---------- derived: per-stop visuals ---------- */
  const stopVisual = (i: number) => {
    const m = story?.memories[i];
    return {
      icon: m?.icon || ["💖", "✨", "☕", "🌙", "🍰", "🌸", "🎶"][i % 7],
      importance: m?.importance || (i === 0 ? "high" : i === stops.length - 1 ? "high" : "medium"),
      pathStyle: m?.pathStyle || (i === 0 ? "dotted" : i < stops.length / 2 ? "smooth" : "glowing"),
      memory: m?.memory,
      moodEmoji: m?.moodEmoji,
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-warm">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-aurora opacity-[0.18] animate-gradient-pan" />
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-rose blur-3xl opacity-30" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-candy blur-3xl opacity-40" />

          <div className="container-narrow relative pt-14 pb-10">
            <div className="flex items-center gap-2 text-sm tracking-widest uppercase text-primary mb-3">
              <Sparkles className="h-4 w-4" /> Relationship Map
            </div>
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] max-w-3xl">
              Every place you've been —{" "}
              <span className="gradient-text">woven into one story.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Not a map. A memory. Your visited spots become a glowing journey of
              first nervous coffees, rainy walks, and the night you knew.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" onClick={handleGenerate} disabled={loading}>
                <Wand2 className="mr-1" />
                {loading ? "Weaving your story…" : story ? "Re-weave story" : "Bring journey to life"}
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/plan">
                  Plan the next chapter <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CONTROLS */}
        <section className="container-narrow pt-2 pb-6">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <TabsList className="glass border border-primary/15 rounded-full p-1">
                <TabsTrigger value="map" className="rounded-full gap-2 data-[state=active]:bg-gradient-rose data-[state=active]:text-primary-foreground">
                  <MapIcon className="h-4 w-4" /> Map
                </TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-full gap-2 data-[state=active]:bg-gradient-rose data-[state=active]:text-primary-foreground">
                  <Clock className="h-4 w-4" /> Timeline
                </TabsTrigger>
                <TabsTrigger value="story" className="rounded-full gap-2 data-[state=active]:bg-gradient-rose data-[state=active]:text-primary-foreground">
                  <BookOpen className="h-4 w-4" /> Story
                </TabsTrigger>
              </TabsList>

              <Button
                variant={playing ? "outline" : "soft"}
                size="sm"
                onClick={() => setPlaying((p) => !p)}
                className="rounded-full"
              >
                {playing ? <><Pause /> Pause</> : <><Play /> Play our journey</>}
              </Button>
            </div>

            {/* MAP VIEW */}
            <TabsContent value="map" className="mt-6">
              <StyledMap
                W={W}
                H={H}
                stops={stops}
                positions={positions}
                stopVisual={stopVisual}
                activeIdx={activeIdx}
                onMarker={(i) => setOpenIdx(i)}
              />
              {story?.insights?.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {story.insights.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="bg-primary-soft/60 text-foreground rounded-full px-4 py-2 text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </TabsContent>

            {/* TIMELINE VIEW */}
            <TabsContent value="timeline" className="mt-6">
              <TimelineView
                stops={stops}
                stopVisual={stopVisual}
                activeIdx={activeIdx}
                onOpen={(i) => setOpenIdx(i)}
              />
            </TabsContent>

            {/* STORY VIEW */}
            <TabsContent value="story" className="mt-6">
              <StoryView story={story} stops={stops} onGenerate={handleGenerate} loading={loading} />
            </TabsContent>
          </Tabs>
        </section>

        {/* EDITOR */}
        <section className="container-narrow pb-20">
          <div className="rounded-3xl border border-primary/15 bg-card/80 backdrop-blur p-6 md:p-8 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-5 w-5 text-primary" fill="currentColor" />
              <h3 className="font-serif text-2xl">Your places</h3>
              <span className="text-xs text-muted-foreground ml-auto">{stops.length} stops</span>
            </div>

            <div className="grid gap-2">
              {stops.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-background/60 px-4 py-3">
                  <span className="text-xl">{stopVisual(i).icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.place}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.date || "—"}{s.notes ? ` · ${s.notes}` : ""}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeStop(i)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[1.4fr_1fr_auto] items-start">
              <Input
                placeholder="Place name (e.g. Blue Tokai, Koramangala)"
                value={newPlace} onChange={(e) => setNewPlace(e.target.value)}
              />
              <Input
                type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
              />
              <Button variant="hero" onClick={addStop}><Plus /> Add stop</Button>
              <Textarea
                placeholder="A small note — what happened here? (optional)"
                value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                className="md:col-span-3"
                rows={2}
              />
            </div>
          </div>
        </section>
      </main>

      {/* MEMORY MODAL */}
      <Dialog open={openIdx !== null} onOpenChange={(o) => !o && setOpenIdx(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-primary/20 rounded-3xl">
          {openIdx !== null && stops[openIdx] && (
            <MemoryCard
              stop={stops[openIdx]}
              visual={stopVisual(openIdx)}
              index={openIdx}
              onClose={() => setOpenIdx(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

/* ============= STYLED MAP ============= */
function StyledMap({
  W, H, stops, positions, stopVisual, activeIdx, onMarker,
}: {
  W: number; H: number;
  stops: JourneyStopInput[];
  positions: { x: number; y: number }[];
  stopVisual: (i: number) => { icon: string; importance: "low" | "medium" | "high"; pathStyle: "dotted" | "smooth" | "glowing"; memory?: string; moodEmoji?: string };
  activeIdx: number | null;
  onMarker: (i: number) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);

  return (
    <div className="relative rounded-[2rem] overflow-hidden border border-primary/15 shadow-glow bg-gradient-aurora">
      {/* dreamy backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/40 via-fuchsia-100/30 to-violet-100/40 mix-blend-overlay" />
      <div className="absolute inset-0 [background:radial-gradient(circle_at_20%_20%,hsl(var(--primary-glow)/0.35),transparent_45%),radial-gradient(circle_at_80%_70%,hsl(var(--violet)/0.35),transparent_45%)]" />
      {/* twinkles */}
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white/80 animate-float-slow"
          style={{
            top: `${(i * 47) % 100}%`,
            left: `${(i * 83) % 100}%`,
            animationDelay: `${(i * 0.3) % 5}s`,
            opacity: 0.5 + ((i * 13) % 50) / 100,
          }}
        />
      ))}

      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="relative w-full h-auto block"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="pathGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(340 95% 75%)" />
            <stop offset="50%" stopColor="hsl(320 80% 60%)" />
            <stop offset="100%" stopColor="hsl(280 80% 65%)" />
          </linearGradient>
          <linearGradient id="glowPath" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(45 100% 75%)" />
            <stop offset="50%" stopColor="hsl(340 95% 70%)" />
            <stop offset="100%" stopColor="hsl(280 80% 65%)" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* paths between consecutive stops */}
        {positions.slice(1).map((p, i) => {
          const a = positions[i];
          const b = p;
          const style = stopVisual(i + 1).pathStyle;
          const d = pathBetween(a, b);
          if (style === "dotted") {
            return (
              <path
                key={`p-${i}`}
                d={d}
                fill="none"
                stroke="hsl(340 70% 65% / 0.85)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="2 10"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2.4s" repeatCount="indefinite" />
              </path>
            );
          }
          if (style === "smooth") {
            return (
              <path
                key={`p-${i}`}
                d={d}
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
            );
          }
          // glowing
          return (
            <g key={`p-${i}`}>
              <path d={d} fill="none" stroke="url(#glowPath)" strokeWidth={10} strokeLinecap="round" opacity={0.35} filter="url(#softGlow)" />
              <path d={d} fill="none" stroke="url(#glowPath)" strokeWidth={4} strokeLinecap="round">
                <animate attributeName="stroke-dasharray" values="0 600; 600 0" dur="3.5s" repeatCount="indefinite" />
              </path>
            </g>
          );
        })}

        {/* markers */}
        {positions.map((p, i) => {
          const v = stopVisual(i);
          const r = importanceRadius[v.importance];
          const isActive = activeIdx === i;
          return (
            <g
              key={`m-${i}`}
              transform={`translate(${p.x} ${p.y})`}
              className="cursor-pointer"
              onClick={() => onMarker(i)}
            >
              {/* halo */}
              <circle r={r + 14} fill="hsl(340 95% 70% / 0.18)">
                {isActive && (
                  <animate attributeName="r" values={`${r + 8};${r + 22};${r + 8}`} dur="1.4s" repeatCount="indefinite" />
                )}
              </circle>
              <circle r={r + 6} fill="hsl(340 95% 75% / 0.35)" filter="url(#softGlow)" />
              {/* core */}
              <circle r={r} fill="white" stroke="url(#pathGradient)" strokeWidth={3} />
              <text
                y={r * 0.35}
                textAnchor="middle"
                fontSize={r * 1.05}
                style={{ userSelect: "none" }}
              >
                {v.icon}
              </text>
              {/* place label */}
              <g transform={`translate(0 ${r + 26})`}>
                <rect
                  x={-Math.min(140, stops[i].place.length * 4.2 + 14)}
                  y={-13}
                  width={Math.min(280, stops[i].place.length * 8.4 + 28)}
                  height={24}
                  rx={12}
                  fill="hsl(0 0% 100% / 0.85)"
                  stroke="hsl(340 70% 80% / 0.6)"
                />
                <text textAnchor="middle" y={4} fontSize={12} fontWeight={600} fill="hsl(340 35% 18%)">
                  {stops[i].place.length > 28 ? stops[i].place.slice(0, 26) + "…" : stops[i].place}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="absolute bottom-4 left-4 flex gap-3 text-xs glass rounded-full px-4 py-2 border border-white/40">
        <span className="flex items-center gap-1.5"><span className="inline-block h-[2px] w-5 border-t-2 border-dotted border-primary" /> first sparks</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-[2px] w-5 bg-gradient-rose rounded" /> growing</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-[3px] w-5 bg-gradient-aurora rounded shadow-glow" /> deep bond</span>
      </div>
    </div>
  );
}

/* ============= TIMELINE ============= */
function TimelineView({
  stops, stopVisual, activeIdx, onOpen,
}: {
  stops: JourneyStopInput[];
  stopVisual: (i: number) => ReturnType<Parameters<typeof StyledMap>[0]["stopVisual"]>;
  activeIdx: number | null;
  onOpen: (i: number) => void;
}) {
  return (
    <div className="relative rounded-3xl bg-card/70 backdrop-blur border border-primary/15 p-6 md:p-10 shadow-card">
      <div className="absolute left-10 md:left-14 top-10 bottom-10 w-1 rounded-full bg-gradient-rose opacity-70" />
      <div className="space-y-6">
        {stops.map((s, i) => {
          const v = stopVisual(i);
          const isActive = activeIdx === i;
          return (
            <motion.button
              key={i}
              onClick={() => onOpen(i)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative w-full text-left flex gap-5 items-start group"
            >
              <div className={`relative shrink-0 z-10 ml-1 md:ml-5 h-14 w-14 rounded-full bg-white border-2 flex items-center justify-center text-2xl shadow-soft transition-all ${isActive ? "border-primary scale-110" : "border-primary/30"}`}>
                {v.icon}
                {isActive && <span className="absolute inset-0 rounded-full ring-4 ring-primary/30 animate-pulse" />}
              </div>
              <div className="flex-1 rounded-2xl border border-primary/10 bg-background/70 p-4 group-hover:bg-primary-soft/30 transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-serif text-xl">{s.place}</h4>
                  {v.moodEmoji && <span className="text-lg">{v.moodEmoji}</span>}
                  <span className="ml-auto text-xs text-muted-foreground">{s.date || "—"}</span>
                </div>
                {(v.memory || s.notes) && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {v.memory || s.notes}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ============= STORY MODE ============= */
function StoryView({
  story, stops, onGenerate, loading,
}: {
  story: JourneyStory | null;
  stops: JourneyStopInput[];
  onGenerate: () => void;
  loading: boolean;
}) {
  if (!story) {
    return (
      <div className="rounded-3xl bg-gradient-blossom border border-primary/15 p-10 md:p-14 text-center shadow-card">
        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-rose flex items-center justify-center text-3xl shadow-glow">📖</div>
        <h3 className="mt-5 font-serif text-3xl">Your story is waiting to be written.</h3>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Add your places, then let DateCraft turn them into a love-letter narrative — first date to forever.
        </p>
        <Button variant="hero" size="lg" className="mt-6" onClick={onGenerate} disabled={loading || stops.length < 2}>
          <Wand2 /> {loading ? "Weaving…" : "Write our story"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
      <article className="rounded-3xl bg-card/85 backdrop-blur border border-primary/15 p-8 md:p-10 shadow-card">
        <p className="text-xs tracking-widest uppercase text-primary mb-2">Our journey</p>
        <h2 className="font-serif text-3xl md:text-4xl gradient-text">{story.title}</h2>
        <p className="mt-4 font-serif italic text-xl text-foreground/80 border-l-2 border-primary/40 pl-4">
          {story.opening}
        </p>
        <p className="mt-6 leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {story.narrative}
        </p>
      </article>

      <aside className="space-y-4">
        <HighlightCard label="First date" value={story.highlights.firstDate} emoji="🌱" tone="from-rose-200/60 to-rose-100/30" />
        <HighlightCard label="Best date" value={story.highlights.bestDate} emoji="❤️" tone="from-fuchsia-200/60 to-rose-100/30" />
        <HighlightCard label="Funniest moment" value={story.highlights.funniest} emoji="😂" tone="from-amber-200/70 to-rose-100/30" />
        {story.insights?.length ? (
          <div className="rounded-3xl border border-primary/15 bg-card/85 p-5">
            <div className="text-xs uppercase tracking-widest text-primary mb-3">Patterns we noticed</div>
            <div className="flex flex-wrap gap-2">
              {story.insights.map((t, i) => (
                <Badge key={i} variant="secondary" className="bg-primary-soft/60 text-foreground rounded-full px-3 py-1.5">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function HighlightCard({ label, value, emoji, tone }: { label: string; value: string; emoji: string; tone: string }) {
  return (
    <div className={`rounded-3xl border border-primary/15 p-5 bg-gradient-to-br ${tone} backdrop-blur`}>
      <div className="text-xs uppercase tracking-widest text-foreground/60">{label}</div>
      <div className="mt-1 flex items-center gap-2 font-serif text-xl">
        <span className="text-2xl">{emoji}</span>
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

/* ============= MEMORY MODAL ============= */
function MemoryCard({
  stop, visual, index, onClose,
}: {
  stop: JourneyStopInput;
  visual: { icon: string; importance: string; memory?: string; moodEmoji?: string };
  index: number;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="relative h-40 bg-gradient-aurora">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,white/40,transparent_60%)]" />
        <button onClick={onClose} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 hover:bg-white grid place-items-center">
          <X className="h-4 w-4" />
        </button>
        <div className="absolute -bottom-8 left-6 h-20 w-20 rounded-full bg-white border-4 border-white shadow-glow grid place-items-center text-4xl">
          {visual.icon}
        </div>
      </div>
      <div className="px-6 pt-12 pb-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            {stop.place} {visual.moodEmoji && <span className="text-xl">{visual.moodEmoji}</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-1 text-xs uppercase tracking-widest text-primary">
          Stop {index + 1} · {stop.date || "—"}
        </div>

        {(stop.photos?.length ?? 0) > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {stop.photos!.map((url, i) => (
              <img key={i} src={url} alt={`${stop.place} ${i + 1}`} className="h-28 w-40 object-cover rounded-xl shrink-0" />
            ))}
          </div>
        )}

        <p className="mt-4 leading-relaxed text-foreground/90">
          {visual.memory || stop.notes || "A quiet moment, just the two of you."}
        </p>

        {stop.activity && (
          <Badge variant="secondary" className="mt-4 bg-primary-soft/60 rounded-full">
            {stop.activity}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default Journey;
