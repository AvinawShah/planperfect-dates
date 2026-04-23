import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  { name: "Aanya & Rohan", city: "Bengaluru", text: "We were stuck in 'pizza-and-Netflix' loop for months. DateCraft pulled us out in one evening — actual best Friday in a long time.", emoji: "🌙" },
  { name: "Priya & Karan", city: "Mumbai", text: "I asked for ₹800, foodie mood. It planned a Bandra crawl I'd never have thought of. He was *very* impressed.", emoji: "🍣" },
  { name: "Sara & Dev", city: "Delhi", text: "Surprise Me button is dangerous. We're now on date #3 in two weeks because of it.", emoji: "💗" },
  { name: "Tara & Leo", city: "Goa", text: "Used it on our anniversary trip. The plan felt like a friend who knew exactly what we needed.", emoji: "🌅" },
];

const Testimonials = () => (
  <section className="py-24">
    <div className="container-narrow">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm tracking-widest uppercase text-primary mb-4">Loved by couples</p>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight">Real dates, <em className="gradient-text">real reviews</em>.</h2>
      </div>
      <div className="mt-14 grid md:grid-cols-2 gap-6">
        {reviews.map((r, i) => (
          <motion.figure
            key={r.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-3xl bg-card p-8 border border-primary/10 shadow-card"
          >
            <div className="flex items-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4" fill="currentColor" />)}
            </div>
            <blockquote className="mt-4 font-serif text-xl leading-relaxed">"{r.text}"</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg">{r.emoji}</span>
              <div className="text-sm">
                <div className="font-medium">{r.name}</div>
                <div className="text-muted-foreground">{r.city}</div>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
