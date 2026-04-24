import { dateTemplates, type DateTemplate } from "@/lib/templates";
import { motion } from "framer-motion";

interface Props {
  onPick: (t: DateTemplate) => void;
}

// Vibrant per-card backdrops keyed by template id
const cardStyles: Record<string, string> = {
  "first-date": "bg-gradient-to-br from-pink-200 via-rose-100 to-orange-100",
  "anniversary": "bg-gradient-to-br from-rose-300 via-pink-200 to-fuchsia-200",
  "rainy-sunday": "bg-gradient-to-br from-sky-200 via-indigo-100 to-purple-100",
  "comedy-night": "bg-gradient-to-br from-yellow-200 via-orange-200 to-pink-200",
  "birthday": "bg-gradient-to-br from-fuchsia-200 via-pink-200 to-amber-100",
  "adventure-day": "bg-gradient-to-br from-emerald-200 via-teal-100 to-sky-200",
  "temple-date": "bg-gradient-to-br from-amber-200 via-orange-100 to-rose-100",
  "spiritual-sunset": "bg-gradient-to-br from-orange-300 via-rose-200 to-violet-200",
};

const TemplateGallery = ({ onPick }: Props) => {
  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary flex items-center gap-1.5">
            <span>✨</span> Inspiration
          </p>
          <h3 className="font-serif text-2xl mt-1">Plan like this 💌</h3>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
          <span>👆</span> Tap to autofill
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {dateTemplates.map((t, i) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative overflow-hidden text-left rounded-2xl border border-white/60 p-4 shadow-card hover:shadow-pop transition-all ${cardStyles[t.id] ?? "bg-gradient-blossom"}`}
          >
            {/* Decorative blob */}
            <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-white/40 blur-xl group-hover:scale-125 transition-transform" />
            <div className="relative">
              <div className="text-3xl mb-2 drop-shadow-sm group-hover:animate-wiggle">{t.emoji}</div>
              <div className="font-semibold text-sm leading-tight text-foreground/90">{t.title}</div>
              <p className="mt-1 text-[11px] text-foreground/65 line-clamp-2 leading-snug">{t.blurb}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="px-1.5 py-0.5 rounded-full bg-white/70 text-foreground/80 font-medium">💸 ₹{t.budget}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/70 text-foreground/80 font-medium">⏱ {t.durationHours}h</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/70 text-foreground/80 font-medium capitalize">{t.mood}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default TemplateGallery;
