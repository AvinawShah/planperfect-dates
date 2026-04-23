import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { listEvents, type EventItem } from "@/lib/api";
import { Button } from "@/components/ui/button";

const EventsPreview = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  useEffect(() => { listEvents().then(setEvents); }, []);

  return (
    <section className="py-24 bg-background">
      <div className="container-narrow">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
          <div>
            <p className="text-sm tracking-widest uppercase text-primary mb-3">This week</p>
            <h2 className="font-serif text-4xl md:text-5xl">Hand-picked events for two.</h2>
          </div>
          <Button asChild variant="outline"><Link to="/events">See all events</Link></Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.slice(0, 4).map((e, i) => (
            <motion.article
              key={e.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group rounded-2xl overflow-hidden bg-card border border-primary/10 shadow-card hover:shadow-glow transition-shadow"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={e.image} alt={e.title} loading="lazy" width={1000} height={750} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {e.tag && (
                  <span className="absolute top-3 left-3 rounded-full bg-card/85 backdrop-blur px-3 py-1 text-xs font-medium text-primary">
                    💕 {e.tag}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{e.type}</p>
                <h3 className="mt-1.5 font-serif text-xl leading-snug">{e.title}</h3>
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{e.date}</span>
                  <span className="font-medium text-foreground">{e.currency}{e.price}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsPreview;
