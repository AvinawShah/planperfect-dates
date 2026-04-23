import { dateTemplates, type DateTemplate } from "@/lib/templates";
import { motion } from "framer-motion";

interface Props {
  onPick: (t: DateTemplate) => void;
}

const TemplateGallery = ({ onPick }: Props) => {
  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Inspiration</p>
          <h3 className="font-serif text-xl">Plan like this →</h3>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">Tap to autofill</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {dateTemplates.map((t, i) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            className="text-left rounded-2xl border border-primary/10 bg-card p-4 shadow-card hover:border-primary/30 hover:shadow-glow transition-all"
          >
            <div className="text-2xl mb-2">{t.emoji}</div>
            <div className="font-medium text-sm leading-tight">{t.title}</div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.blurb}</p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>₹{t.budget}</span>
              <span>·</span>
              <span>{t.durationHours}h</span>
              <span>·</span>
              <span className="capitalize">{t.mood}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default TemplateGallery;
