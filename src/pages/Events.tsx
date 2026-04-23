import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listEvents, type EventItem } from "@/lib/api";

const Events = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  useEffect(() => { listEvents().then(setEvents); }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-narrow py-14">
        <p className="text-sm tracking-widest uppercase text-primary mb-3">Events</p>
        <h1 className="font-serif text-4xl md:text-5xl">Date-friendly happenings.</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">Curated, couple-loved events near you.</p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => (
            <article key={e.id} className="group rounded-2xl overflow-hidden bg-card border border-primary/10 shadow-card hover:shadow-glow transition-shadow">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={e.image} alt={e.title} loading="lazy" width={1000} height={750} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{e.type}</p>
                <h2 className="font-serif text-xl mt-1.5">{e.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{e.location}</p>
                <div className="mt-4 flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{e.date}</span>
                  <span className="rounded-full bg-primary-soft text-primary px-3 py-1 font-medium">{e.currency}{e.price}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
