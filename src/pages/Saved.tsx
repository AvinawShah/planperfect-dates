import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ItineraryView from "@/components/ItineraryView";
import { Button } from "@/components/ui/button";
import { deletePlan, getSavedPlans, type Plan } from "@/lib/api";
import { toast } from "sonner";

const Saved = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => { setPlans(getSavedPlans()); }, []);

  function remove(id: string) {
    deletePlan(id); setPlans(getSavedPlans()); toast.success("Removed");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-narrow py-14">
        <p className="text-sm tracking-widest uppercase text-primary mb-3">Saved</p>
        <h1 className="font-serif text-4xl md:text-5xl">Your date library.</h1>

        {plans.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-primary/30 p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-rose flex items-center justify-center text-3xl shadow-soft">💌</div>
            <h3 className="mt-5 font-serif text-2xl">Nothing saved yet.</h3>
            <p className="mt-2 text-muted-foreground">Generate a plan you love and tap Save — it'll live here.</p>
            <Button asChild variant="hero" size="lg" className="mt-6"><Link to="/plan">Plan a date</Link></Button>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {plans.map((p) => (
              <div key={p.id} className="relative">
                <ItineraryView plan={p} />
                <Button
                  onClick={() => remove(p.id)} variant="ghost" size="sm"
                  className="absolute top-6 right-6 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Saved;
