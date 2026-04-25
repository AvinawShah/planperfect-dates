import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookHeart, Loader2, Copy, Sparkles, RefreshCw, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateDateStory, type DateStory, type Plan, type StoryPhoto } from "@/lib/api";

interface Props {
  plan: Plan;
}

interface UIPhoto extends StoryPhoto {
  previewUrl: string;
}

const MAX_PHOTOS = 4;
const MAX_BYTES = 4 * 1024 * 1024; // 4MB per photo

const moodToneLabel: Record<string, { label: string; emoji: string }> = {
  romantic: { label: "Poetic & soft", emoji: "💕" },
  spiritual: { label: "Poetic & soft", emoji: "🕊️" },
  playful: { label: "Playful & fun", emoji: "🎉" },
  foodie: { label: "Playful & fun", emoji: "🍝" },
  adventurous: { label: "Playful & fun", emoji: "⛰️" },
  chill: { label: "Cozy & reflective", emoji: "🌙" },
  cultural: { label: "Cozy & reflective", emoji: "🎭" },
};

const DateStoryCard = ({ plan }: Props) => {
  const [story, setStory] = useState<DateStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<UIPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tone = moodToneLabel[plan.mood] || { label: "Warm & cinematic", emoji: "✨" };

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_PHOTOS} photos`);
      return;
    }
    const next: UIPhoto[] = [];
    for (const f of files.slice(0, room)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is too large (max 4MB)`);
        continue;
      }
      const dataUrl = await fileToDataUrl(f);
      next.push({
        id: `photo${photos.length + next.length + 1}`,
        previewUrl: dataUrl,
        dataUrl,
        description: "",
      });
    }
    if (next.length) setPhotos((p) => [...p, ...next]);
  }

  function updateCaption(id: string, description: string) {
    setPhotos((p) => p.map((ph) => (ph.id === id ? { ...ph, description } : ph)));
  }

  function removePhoto(id: string) {
    setPhotos((p) => p.map((ph, i) => ({ ...ph, id: `photo${i + 1}` })).filter((ph) => ph.id !== id));
    // re-id sequentially after removal
    setPhotos((curr) => curr.filter((ph) => ph.id !== id).map((ph, i) => ({ ...ph, id: `photo${i + 1}` })));
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const s = await generateDateStory(plan, {
        photos: photos.map((p) => ({ id: p.id, description: p.description, dataUrl: p.dataUrl })),
      });
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
    const tags = (story.hashtags || []).join(" ");
    const text = `${story.title}\n\n${story.story}\n\n✨ ${story.highlight}\n\n📸 ${story.caption}\n${tags}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard 📋");
  }

  const photoById = (id?: string) => photos.find((p) => p.id === id);

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
              {tone.emoji} <span className="font-medium">{tone.label}</span> tone · add up to {MAX_PHOTOS} photos for a richer story ✨
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

        {/* Photo uploader */}
        <div className="mt-6 rounded-2xl bg-white/85 backdrop-blur p-4 md:p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm font-medium text-foreground/80 flex items-center gap-2">
              📸 Photos <span className="text-xs text-muted-foreground">({photos.length}/{MAX_PHOTOS})</span>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddPhotos}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= MAX_PHOTOS}
              >
                <ImagePlus className="h-4 w-4" /> Add photos
              </Button>
            </div>
          </div>

          {photos.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="relative rounded-xl overflow-hidden border border-border bg-background group">
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="absolute top-1.5 right-1.5 z-10 rounded-full bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <img src={p.previewUrl} alt={`Date photo ${p.id}`} className="w-full h-28 object-cover" />
                  <input
                    type="text"
                    value={p.description || ""}
                    onChange={(e) => updateCaption(p.id, e.target.value)}
                    placeholder={`Caption for ${p.id}…`}
                    className="w-full text-xs px-2 py-1.5 border-t border-border bg-background focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Tip: add a photo or two and tag them with quick captions like "first laugh" or "sunset walk" — the AI will weave them into the story.
            </p>
          )}
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

              {/* Timeline beats */}
              {story.timeline?.length > 0 && (
                <div className="rounded-2xl bg-white/90 backdrop-blur p-5 md:p-6 shadow-soft">
                  <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-4">
                    🎬 Story timeline
                  </div>
                  <div className="space-y-4">
                    {story.timeline.map((beat, i) => {
                      const photo = photoById(beat.photoReference);
                      const dot = beat.moment === "Beginning" ? "🌅" : beat.moment === "Highlight" ? "✨" : "🌙";
                      return (
                        <div key={`${beat.moment}-${i}`} className="flex gap-3 items-start">
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-rose flex items-center justify-center text-base shadow-soft">
                            {dot}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-primary uppercase tracking-wide">
                              {beat.moment}
                            </div>
                            <p className="mt-0.5 text-sm text-foreground/85 leading-relaxed">
                              {beat.description}
                            </p>
                          </div>
                          {photo && (
                            <img
                              src={photo.previewUrl}
                              alt={beat.moment}
                              className="h-16 w-16 rounded-lg object-cover border border-border flex-shrink-0"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  {story.hashtags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {story.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium"
                        >
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  )}
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
