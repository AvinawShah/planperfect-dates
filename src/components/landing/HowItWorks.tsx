import { motion } from "framer-motion";
import { Heart, MapPin, SlidersHorizontal } from "lucide-react";

const steps = [
  { n: "01", icon: SlidersHorizontal, title: "Tell us the vibe", desc: "Budget, mood, time, and where you are. Takes ten seconds." },
  { n: "02", icon: MapPin, title: "AI builds the route", desc: "We pull real nearby places and weave them into a perfect arc." },
  { n: "03", icon: Heart, title: "Show up & enjoy", desc: "Save it, share it, swap any stop. Your only job is to be present." },
];

const HowItWorks = () => (
  <section className="py-24">
    <div className="container-narrow text-center max-w-2xl mx-auto">
      <p className="text-sm tracking-widest uppercase text-primary mb-4">How it works</p>
      <h2 className="font-serif text-4xl md:text-5xl leading-tight">Three steps to a great night.</h2>
    </div>
    <div className="container-narrow mt-16 grid md:grid-cols-3 gap-8">
      {steps.map((s, i) => (
        <motion.div
          key={s.n}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="relative rounded-3xl bg-gradient-warm p-8 border border-primary/10"
        >
          <span className="absolute right-6 top-6 font-serif text-5xl text-primary/15">{s.n}</span>
          <s.icon className="h-7 w-7 text-primary" />
          <h3 className="mt-5 font-serif text-2xl">{s.title}</h3>
          <p className="mt-2 text-muted-foreground">{s.desc}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

export default HowItWorks;
