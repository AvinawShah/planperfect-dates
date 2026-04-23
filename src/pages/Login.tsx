import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/api";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    signIn(email, name);
    toast.success("Welcome 💖");
    navigate("/plan");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-warm">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-card border border-primary/10 p-10 shadow-glow">
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-rose shadow-soft">
              <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
            </span>
          </div>
          <h1 className="mt-5 font-serif text-3xl text-center">Sign in to DateCraft</h1>
          <p className="text-center text-sm text-muted-foreground mt-1">Save your plans and pick up where you left off.</p>

          <div className="mt-7 space-y-3">
            <input
              type="text" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
              required maxLength={120}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full mt-6">Continue</Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            New here? <Link to="/login" className="text-primary hover:underline">Just sign in</Link> — your account is created automatically.
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
