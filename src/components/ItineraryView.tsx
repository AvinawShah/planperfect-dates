import { motion } from "framer-motion";
import { Bookmark, Share2, Sparkles } from "lucide-react";
import type { Plan } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Props {
  plan: Plan;
  onSave?: () => void;
  onShare?: () => void;
  saved?: boolean;
}

const ItineraryView = ({ plan, onSave, onShare, saved }: Props) => {
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
          <div className="flex gap-2">
            {onSave && (
              <Button onClick={onSave} variant="outline" size="sm" className="bg-white/90 border-white/40">
                <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
                {saved ? "Saved 💖" : "Save"}
              </Button>
            )}
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
        {plan.itinerary.map((item, i) => (
          <motion.li
            key={`${item.time}-${i}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="relative flex items-start gap-5 py-5 first:pt-0 last:pb-0"
          >
            <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-rose text-xl shadow-soft">
              {item.emoji ?? "📍"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{item.time}</div>
              <div className="mt-0.5 font-serif text-2xl leading-snug">{item.activity}</div>
              <div className="text-muted-foreground">{item.place}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-medium">{plan.currency}{item.cost}</div>
              <div className="text-xs text-muted-foreground">est.</div>
            </div>
          </motion.li>
        ))}
      </ol>
    </article>
  );
};

export default ItineraryView;
