import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Share2, Sparkles, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import type { Plan } from "@/lib/api";
import { Button } from "@/components/ui/button";
import ShareableCard from "@/components/plan/ShareableCard";

interface Props {
  plan: Plan;
  onSave?: () => void;
  onShare?: () => void;
  saved?: boolean;
}

const ItineraryView = ({ plan, onSave, onShare, saved }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExportImage() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#fff1f2",
      });
      const link = document.createElement("a");
      const safeTitle = plan.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      link.download = `datecraft-${safeTitle || "plan"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded 💖");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't export image. Try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <article className="rounded-3xl bg-card border border-primary/10 shadow-glow overflow-hidden">
      <header className="relative bg-gradient-aurora animate-gradient-pan p-8 md:p-10 overflow-hidden">
        {/* floating sparkles */}
        <span className="pointer-events-none absolute top-4 right-6 text-2xl animate-float-slow">✨</span>
        <span className="pointer-events-none absolute bottom-4 left-8 text-xl animate-float-slow" style={{ animationDelay: "1.5s" }}>💖</span>
        <span className="pointer-events-none absolute top-10 left-1/2 text-lg animate-float-slow" style={{ animationDelay: "2.5s" }}>🌟</span>
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/90 flex items-center gap-2 font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Your AI date plan 💌
            </p>
            <h2 className="mt-2 font-serif text-4xl md:text-5xl leading-tight text-white drop-shadow-sm">
              {plan.title}
            </h2>
            <p className="mt-2 text-white/85 capitalize text-sm md:text-base">
              💝 {plan.mood} · 📍 {plan.location} · 💸 {plan.currency}{plan.totalCost} of {plan.currency}{plan.budget}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onSave && (
              <Button onClick={onSave} variant="outline" size="sm" className="bg-white/90 border-white/40">
                <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
                {saved ? "Saved 💖" : "Save"}
              </Button>
            )}
            <Button onClick={handleExportImage} variant="outline" size="sm" disabled={exporting} className="bg-white/90 border-white/40">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? "Exporting…" : "Export 🖼️"}
            </Button>
            {onShare && (
              <Button onClick={onShare} variant="soft" size="sm" className="bg-white/90">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            )}
          </div>
        </div>
      </header>

      <ol className="relative p-8 md:p-10">
        <span className="absolute left-[3.25rem] top-12 bottom-12 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" aria-hidden />
        {plan.itinerary.map((item, i) => {
          const markerGradients = [
            "bg-gradient-to-br from-rose-400 to-pink-500",
            "bg-gradient-to-br from-amber-300 to-orange-500",
            "bg-gradient-to-br from-fuchsia-400 to-violet-500",
            "bg-gradient-to-br from-sky-400 to-indigo-500",
            "bg-gradient-to-br from-emerald-400 to-teal-500",
            "bg-gradient-to-br from-yellow-300 to-rose-400",
          ];
          return (
            <motion.li
              key={`${item.time}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative flex items-start gap-5 py-5 first:pt-0 last:pb-0"
            >
              <span className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl shadow-soft text-white ${markerGradients[i % markerGradients.length]}`}>
                {item.emoji ?? "📍"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-widest text-primary font-semibold">⏰ {item.time}</div>
                <div className="mt-0.5 font-serif text-2xl leading-snug">{item.activity}</div>
                <div className="text-muted-foreground text-sm">📍 {item.place}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-primary">{plan.currency}{item.cost}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">est.</div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </article>
  );
};

export default ItineraryView;
