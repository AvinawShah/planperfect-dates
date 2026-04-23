import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import dateDinner from "@/assets/date-dinner.jpg";

const sample = [
  { time: "5:30 PM", emoji: "🍜", activity: "Street food crawl", place: "Thindi Beedi", cost: 200 },
  { time: "7:00 PM", emoji: "🎤", activity: "Stand-up comedy show", place: "That Comedy Club", cost: 500 },
  { time: "9:00 PM", emoji: "🍰", activity: "Dessert & coffee", place: "Glen's Bakehouse", cost: 300 },
];

const Solution = () => (
  <section className="py-24 bg-gradient-warm">
    <div className="container-narrow grid md:grid-cols-2 gap-14 items-center">
      <div>
        <p className="text-sm tracking-widest uppercase text-primary mb-4">The DateCraft way</p>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight">
          A complete plan, <em className="gradient-text">in three sentences</em>.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Tell us your budget, mood, and city. We pick real places nearby, sequence them perfectly, and stay inside your budget.
        </p>
        <Button asChild variant="hero" size="lg" className="mt-8">
          <Link to="/plan">Try it free</Link>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className="absolute -top-6 -right-4 h-24 w-24 rounded-full bg-primary-soft blur-2xl opacity-70" aria-hidden />
        <div className="rounded-3xl bg-card shadow-glow border border-primary/10 overflow-hidden">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={dateDinner}
              alt="Couple at a candlelit rooftop"
              loading="lazy"
              width={1080}
              height={810}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-widest uppercase text-muted-foreground">Sample itinerary</span>
              <span className="text-sm font-medium text-primary">₹1,000 · Fun Evening</span>
            </div>
            <ul className="mt-5 space-y-4">
              {sample.map((s) => (
                <li key={s.time} className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{s.activity} <span className="text-muted-foreground font-normal">· {s.place}</span></div>
                    <div className="text-sm text-muted-foreground">{s.time}</div>
                  </div>
                  <span className="text-sm font-medium">₹{s.cost}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default Solution;
