import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listDeals, type Deal } from "@/lib/api";

const Deals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  useEffect(() => { listDeals().then(setDeals); }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-narrow py-14">
        <p className="text-sm tracking-widest uppercase text-primary mb-3">Deals</p>
        <h1 className="font-serif text-4xl md:text-5xl">Exclusive for couples.</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">Little perks our partners save just for date nights.</p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((d) => (
            <div key={d.id} className="rounded-2xl bg-card border border-primary/10 p-6 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-rose text-2xl shadow-soft">{d.emoji}</span>
                <span className="rounded-full bg-primary-soft text-primary px-3 py-1 text-xs font-medium">{d.discount}</span>
              </div>
              <h3 className="mt-5 font-serif text-xl">{d.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{d.partner} · {d.location}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{d.category}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Deals;
