import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { listDeals, type Deal } from "@/lib/api";
import { Button } from "@/components/ui/button";

const DealsPreview = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  useEffect(() => { listDeals().then(setDeals); }, []);

  return (
    <section className="py-24 bg-gradient-blossom">
      <div className="container-narrow">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
          <div>
            <p className="text-sm tracking-widest uppercase text-primary mb-3">Exclusive for couples</p>
            <h2 className="font-serif text-4xl md:text-5xl">Sweet little discounts.</h2>
          </div>
          <Button asChild variant="outline"><Link to="/deals">See all deals</Link></Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.slice(0, 6).map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="rounded-2xl bg-card/80 backdrop-blur border border-primary/10 p-5 flex items-center gap-4 hover:shadow-soft transition-shadow"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-rose text-2xl shadow-soft">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">{d.discount}</span>
                  <span className="text-xs text-muted-foreground">{d.category}</span>
                </div>
                <h3 className="mt-1 font-serif text-lg leading-tight">{d.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{d.partner} · {d.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealsPreview;
