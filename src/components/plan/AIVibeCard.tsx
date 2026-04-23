import { Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { VibePrediction, Mood } from "@/lib/api";

interface Props {
  loading: boolean;
  prediction: VibePrediction | null;
  currentMood: Mood;
  onApplyMood: (m: Mood) => void;
  onApplyVibes: (v: string[]) => void;
}

const AIVibeCard = ({ loading, prediction, currentMood, onApplyMood, onApplyVibes }: Props) => {
  if (!loading && !prediction) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={loading ? "loading" : "loaded"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-primary/20 bg-gradient-blossom p-4 shadow-soft"
      >
        <div className="flex items-center gap-2 mb-2">
          {loading ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
          <p className="text-xs uppercase tracking-widest text-primary font-medium">
            {loading ? "AI is thinking…" : "AI suggestion"}
          </p>
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded animate-shimmer" />
            <div className="h-3 w-1/2 rounded animate-shimmer" />
          </div>
        )}

        {!loading && prediction && (
          <>
            <p className="text-sm leading-relaxed text-foreground/90">
              <span className="font-semibold capitalize">{prediction.suggestedMood}</span> vibes feel right —{" "}
              <span className="text-muted-foreground">{prediction.reasoning}</span>
            </p>

            {prediction.suggestedMood !== currentMood && (
              <button
                type="button"
                onClick={() => onApplyMood(prediction.suggestedMood)}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                Switch to {prediction.suggestedMood} →
              </button>
            )}

            {prediction.tips?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {prediction.tips.map((t, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                    <span className="text-primary">✦</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            )}

            {prediction.suggestedVibes?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {prediction.suggestedVibes.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onApplyVibes(prediction.suggestedVibes)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-card/70 border border-primary/20 text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition"
                  >
                    + {v}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AIVibeCard;
