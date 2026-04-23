import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FinalCTA = () => (
  <section className="py-24">
    <div className="container-narrow">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-sunset p-12 md:p-20 text-center shadow-glow">
        <div aria-hidden className="absolute -top-10 -left-10 text-7xl opacity-30">🌸</div>
        <div aria-hidden className="absolute -bottom-8 -right-6 text-7xl opacity-30">🌷</div>
        <h2 className="font-serif text-4xl md:text-6xl leading-tight max-w-3xl mx-auto text-foreground">
          Stop planning. <em className="italic">Start dating.</em>
        </h2>
        <p className="mt-5 text-lg text-foreground/70 max-w-xl mx-auto">
          Your next great night is sixty seconds away.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild size="xl" variant="hero">
            <Link to="/plan">Create my date plan</Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link to="/plan?surprise=1">Surprise me ✨</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default FinalCTA;
