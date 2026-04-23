import { Heart } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-primary/10 bg-gradient-warm mt-24">
    <div className="container-narrow py-12 grid gap-8 md:grid-cols-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-rose">
            <Heart className="h-3.5 w-3.5 text-primary-foreground" fill="currentColor" />
          </span>
          <span className="font-serif text-xl">Date<span className="gradient-text">Craft</span></span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground max-w-xs">
          Stop planning. Start dating. AI-crafted itineraries with real places, events, and couple deals.
        </p>
      </div>
      <div className="text-sm">
        <h4 className="font-serif text-lg mb-3">Product</h4>
        <ul className="space-y-2 text-muted-foreground">
          <li><a href="/plan" className="hover:text-primary">Plan a date</a></li>
          <li><a href="/events" className="hover:text-primary">Events</a></li>
          <li><a href="/deals" className="hover:text-primary">Deals</a></li>
          <li><a href="/saved" className="hover:text-primary">Saved plans</a></li>
        </ul>
      </div>
      <div className="text-sm">
        <h4 className="font-serif text-lg mb-3">Company</h4>
        <ul className="space-y-2 text-muted-foreground">
          <li>About</li>
          <li>For partners</li>
          <li>Privacy</li>
          <li>Contact</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-primary/10 py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} DateCraft. Made with <Heart className="inline h-3 w-3 -mt-0.5" fill="currentColor" /> for couples.
    </div>
  </footer>
);

export default Footer;
