import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link sets a temporary session via the URL hash.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated 💖");
    navigate("/home");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm px-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-card/90 backdrop-blur-xl border border-primary/10 p-10 shadow-glow">
        <div className="flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-rose shadow-soft">
            <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          </span>
        </div>
        <h1 className="mt-5 font-serif text-3xl text-center">Set a new password</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">
          {ready ? "Choose something memorable yet strong." : "Validating your reset link…"}
        </p>

        <div className="mt-7 space-y-3">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password" placeholder="New password" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={72}
              className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password" placeholder="Confirm password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} required minLength={6} maxLength={72}
              className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full mt-6" disabled={loading || !ready}>
          {loading ? "Saving…" : "Update password"}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
