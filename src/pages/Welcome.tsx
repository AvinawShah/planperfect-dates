import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Heart, Sparkles, MapPin, Calendar, ArrowRight, Mail, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, signIn } from "@/lib/api";
import { toast } from "sonner";

const FloatingHeart = ({ delay, left, size }: { delay: number; left: string; size: number }) => (
  <div
    className="absolute bottom-0 text-primary/30 animate-float-up pointer-events-none"
    style={{
      left,
      animationDelay: `${delay}s`,
      animationDuration: `${8 + (delay % 4)}s`,
    }}
  >
    <Heart fill="currentColor" style={{ width: size, height: size }} />
  </div>
);

const Welcome = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, skip straight to home
  if (getCurrentUser()) return <Navigate to="/home" replace />;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Tell us your name 💕");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      signIn(email, name);
      toast.success(mode === "signup" ? "Welcome to DateCraft 💖" : "Welcome back 💖");
      navigate("/home");
    }, 600);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-warm">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-primary-soft/40 blur-3xl animate-pulse-slow" style={{ animationDelay: "4s" }} />
      </div>

      {/* Floating hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingHeart delay={0} left="8%" size={18} />
        <FloatingHeart delay={1.2} left="22%" size={14} />
        <FloatingHeart delay={2.6} left="38%" size={22} />
        <FloatingHeart delay={0.7} left="55%" size={16} />
        <FloatingHeart delay={3.4} left="68%" size={20} />
        <FloatingHeart delay={1.8} left="82%" size={14} />
        <FloatingHeart delay={4.1} left="92%" size={18} />
      </div>

      <main className="relative z-10 container-narrow min-h-screen flex flex-col">
        {/* Brand */}
        <div className="pt-8 flex items-center gap-2 animate-fade-in">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-rose shadow-glow">
            <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-tight">
            Date<span className="gradient-text">Craft</span>
          </span>
        </div>

        <div className="flex-1 grid lg:grid-cols-2 gap-10 items-center py-10 lg:py-16">
          {/* Left: Hero copy */}
          <div className="space-y-7 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI-curated dates, designed for two
            </span>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              Every date,<br />
              <span className="gradient-text italic">unforgettable.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Plan magical evenings, discover hidden gems, and turn ordinary moments into stories you'll tell forever.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { icon: Sparkles, label: "AI Vibes" },
                { icon: MapPin, label: "Live Maps" },
                { icon: Calendar, label: "Smart Plans" },
                { icon: Heart, label: "Your Journey" },
              ].map((f, i) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 rounded-full bg-card/70 backdrop-blur border border-primary/10 px-4 py-2 text-sm shadow-soft animate-fade-in-up"
                  style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                >
                  <f.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {["#fda4af", "#f9a8d4", "#fcd34d", "#a78bfa"].map((c) => (
                  <span
                    key={c}
                    className="h-8 w-8 rounded-full border-2 border-background"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span>Loved by <strong className="text-foreground">12,000+</strong> couples</span>
            </div>
          </div>

          {/* Right: Auth card */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="absolute -inset-4 bg-gradient-rose opacity-30 blur-2xl rounded-3xl pointer-events-none" />
            <div className="relative rounded-3xl bg-card/90 backdrop-blur-xl border border-primary/10 p-8 md:p-10 shadow-glow">
              {/* Tab switcher */}
              <div className="grid grid-cols-2 p-1 rounded-full bg-muted mb-7">
                {(["signup", "signin"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`relative py-2.5 text-sm font-medium rounded-full transition-all ${
                      mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode === m && (
                      <span className="absolute inset-0 bg-gradient-rose rounded-full shadow-soft" />
                    )}
                    <span className="relative">{m === "signup" ? "Create account" : "Sign in"}</span>
                  </button>
                ))}
              </div>

              <h2 className="font-serif text-3xl">
                {mode === "signup" ? "Begin your story 💕" : "Welcome back 💖"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "signup"
                  ? "A few details and we'll craft your first date."
                  : "Continue planning unforgettable moments."}
              </p>

              <form onSubmit={submit} className="mt-7 space-y-4">
                {mode === "signup" && (
                  <div className="relative animate-fade-in">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={60}
                      className="w-full rounded-xl border border-border bg-background/80 pl-11 pr-4 py-3.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={120}
                    className="w-full rounded-xl border border-border bg-background/80 pl-11 pr-4 py-3.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full group" disabled={loading}>
                  {loading ? "Just a sec…" : mode === "signup" ? "Start crafting dates" : "Continue"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <button
                onClick={() => {
                  signIn("guest@datecraft.app", "Guest");
                  toast.success("Exploring as guest ✨");
                  navigate("/home");
                }}
                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Just browsing? <span className="font-medium underline underline-offset-4">Continue as guest</span>
              </button>

              <p className="mt-7 text-center text-xs text-muted-foreground">
                By continuing you agree to our <a className="text-primary hover:underline">Terms</a> & <a className="text-primary hover:underline">Privacy</a>.
              </p>
            </div>
          </div>
        </div>

        <footer className="py-6 text-center text-xs text-muted-foreground">
          Made with <Heart className="inline h-3 w-3 text-primary" fill="currentColor" /> for couples everywhere
        </footer>
      </main>
    </div>
  );
};

export default Welcome;
