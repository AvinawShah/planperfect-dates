import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookHeart, Loader2, Copy, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateDateStory, type DateStory, type Plan } from "@/lib/api";

interface Props {
  plan: Plan;
}

const DateStoryCard = ({ plan }: Props) => {
  const [story, setStory] = useState<DateStory | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const s = await generateDateStory(plan);
      setStory(s);
      toast.success("Your story is ready 💌");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't write the story.";
      if (msg.toLowerCase().includes("rate")) toast.error("Too many requests. Try again in a moment ✨");
      else if (msg.toLowerCase().includes("credit")) toast.error("AI credits exhausted. Top up to keep storytelling 💖");
      else toast.error("Couldn't write the story. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (!story) return;
    const text = `${story.title}\n\n${story.story}\n\n✨ ${story.highlight}\n\n📸 ${story.caption}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard 📋");
  }

  return (
    <section className="rounded-3xl overflow-hidden border border-primary/10 shadow-glow bg-gradient-candy animate-gradient-pan relative">
      {/* floating accents */}
      <span className="pointer-events-none absolute top-6 right-8 text-2xl animate-float-slow">💌</span>
      <span className="pointer-events-none absolute bottom-8 left-10 text-xl animate-float-slow" style={{ animationDelay: "1.8s" }}>📖</span>
      <span className="pointer-events-none absolute top-1/2 right-1/4 text-lg animate-float-slow" style={{ animationDelay: "3s" }}>✨</span>

      <div className="relative p-8 md:p-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/95 flex items-center gap-2 font-semibold">
              <BookHeart className="h-3.5 w-3.5" /> AI Date Story 💖
            </p>
            <h3 className="mt-2 font-serif text-3xl md:text-4xl text-white drop-shadow-sm">
              Turn this date into a memory
            </h3>
            <p className="mt-1 text-white/85 text-sm md:text-base">
              A warm, 150-word story written just for the two of you ✨
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold shadow-soft"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Writing…</>
            ) : story ? (
              <><RefreshCw className="h-4 w-4" /> Rewrite ✨</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Story 💌</>
            )}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {story && (
            <motion.div
              key={story.story.slice(0, 30)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45 }}
              className="mt-6 grid gap-4"
            >
              <div className="rounded-2xl bg-white/95 backdrop-blur p-6 md:p-7 shadow-soft">
                <h4 className="font-serif text-2xl md:text-3xl text-foreground">
                  {story.title}
                </h4>
                <p className="mt-3 text-foreground/85 leading-relaxed font-serif text-[1.05rem] whitespace-pre-line">
                  {story.story}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-soft">
                  <div className="text-[10px] uppercase tracking-widest text-rose-500 font-bold">
                    ❤️ Best Moment
                  </div>
                  <p className="mt-1.5 text-foreground/85 italic">{story.highlight}</p>
                </div>
                <div className="rounded-2xl bg-white/90 backdrop-blur p-5 shadow-soft">
                  <div className="text-[10px] uppercase tracking-widest text-violet-500 font-bold">
                    📸 Insta Caption
                  </div>
                  <p className="mt-1.5 text-foreground/85">{story.caption}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={copyAll} variant="outline" size="sm" className="bg-white/90">
                  <Copy className="h-4 w-4" /> Copy story
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!story && !loading && (
          <p className="mt-6 text-white/80 text-sm">
            Click <span className="font-semibold">Generate Story</span> to turn your itinerary into a romantic memory you can share.
          </p>
        )}
      </div>
    </section>
  );
};

export default DateStoryCard;
