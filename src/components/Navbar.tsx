import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, signOut } from "@/lib/api";
import { useEffect, useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const i = setInterval(() => setUser(getCurrentUser()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-primary/10">
      <div className="container-narrow flex items-center justify-between h-16">
        <Link to="/home" className="flex items-center gap-2 group">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-rose shadow-soft">
            <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-tight">
            Date<span className="gradient-text">Craft</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          {[
            { to: "/", label: "Home" },
            { to: "/plan", label: "Plan a date" },
            { to: "/journey", label: "Our Journey", glow: true },
            { to: "/events", label: "Events" },
            { to: "/deals", label: "Deals" },
            { to: "/saved", label: "Saved" },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                l.glow
                  ? `relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-all ${
                      isActive
                        ? "bg-gradient-rose text-primary-foreground shadow-glow"
                        : "bg-primary-soft/60 text-primary hover:shadow-soft hover:scale-[1.03]"
                    }`
                  : `transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`
              }
            >
              {l.glow && <Sparkles className="h-3.5 w-3.5" />}
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground">Hi, {user.name}</span>
              <Button variant="ghost" size="icon" onClick={() => { signOut(); setUser(null); navigate("/"); }} aria-label="Sign out">
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/plan">Plan a date</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
