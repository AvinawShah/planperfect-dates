import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroPetals from "@/assets/hero-petals.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: `url(${heroPetals})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-gradient-warm opacity-80" aria-hidden />

      {/* Floating petals */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <span className="absolute left-[8%] top-[18%] text-3xl animate-float-slow">🌸</span>
        <span className="absolute right-[12%] top-[28%] text-2xl animate-float-slow" style={{ animationDelay: "1.5s" }}>🌷</span>
        <span className="absolute left-[18%] bottom-[16%] text-2xl animate-float-slow" style={{ animationDelay: "3s" }}>🌸</span>
        <span className="absolute right-[8%] bottom-[24%] text-3xl animate-float-slow" style={{ animationDelay: "2s" }}>💗</span>
      </div>

      <div className="container-narrow pt-24 pb-28 md:pt-36 md:pb-40 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 backdrop-blur px-4 py-1.5 text-xs text-muted-foreground"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI-crafted dates · loved by 2,400+ couples
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-4xl mx-auto"
        >
          Plan the perfect date <span className="gradient-text italic">in seconds</span> <span className="inline-block">💖</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto"
        >
          No more "where should we go?" Tell us your budget and mood — get a complete, real-world itinerary instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <Button asChild size="xl" variant="hero">
            <Link to="/plan">Create my date plan</Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link to="/plan?surprise=1">
              <Wand2 className="h-4 w-4" /> Surprise me
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 flex items-center justify-center gap-6 text-xs uppercase tracking-widest text-muted-foreground/70"
        >
          <span>· Real places ·</span>
          <span>Live events</span>
          <span>· Couple deals ·</span>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
