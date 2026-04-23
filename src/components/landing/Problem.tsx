import { Brain, Clock, Compass } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { icon: Compass, title: "Too many choices.", desc: "Endless lists, scattered reviews, no real plan." },
  { icon: Clock, title: "Same boring dates.", desc: "Dinner-and-a-movie on repeat. You deserve more." },
  { icon: Brain, title: "Planning is exhausting.", desc: "Tabs, screenshots, group chats. Hours wasted." },
];

const Problem = () => (
  <section className="py-24 bg-background">
    <div className="container-narrow">
      <div className="max-w-2xl">
        <p className="text-sm tracking-widest uppercase text-primary mb-4">The problem</p>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight">
          Date night shouldn't feel like <em className="gradient-text">homework</em>.
        </h2>
      </div>
      <div className="mt-14 grid md:grid-cols-3 gap-6">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl bg-card p-8 shadow-card border border-primary/5"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <it.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-serif text-2xl">{it.title}</h3>
            <p className="mt-2 text-muted-foreground">{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Problem;
