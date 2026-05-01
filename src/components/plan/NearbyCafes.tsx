import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, ExternalLink, Loader2, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Cafe {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  reviews?: number;
  priceLevel?: number;
  mapsUrl?: string;
  openNow?: boolean;
}

interface Props {
  lat: number;
  lng: number;
  label: string;
  budget?: number;     // INR — filters Google price_level
  radius?: number;     // meters
  limit?: number;
}

const priceDots = (lvl?: number) => (lvl == null ? "" : "₹".repeat(Math.max(1, lvl)));

const NearbyCafes = ({ lat, lng, label, budget, radius = 1500, limit = 10 }: Props) => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    const myReq = ++reqRef.current;
    setLoading(true);
    setError(null);
    supabase.functions
      .invoke("places", {
        body: { action: "nearby_cafes", lat, lng, radius, limit, budget },
      })
      .then(({ data, error }) => {
        if (myReq !== reqRef.current) return;
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setCafes(data?.cafes ?? []);
      })
      .catch((e) => {
        if (myReq !== reqRef.current) return;
        console.warn(e);
        setError(e?.message ?? "Couldn't load cafés right now.");
      })
      .finally(() => {
        if (myReq === reqRef.current) setLoading(false);
      });
  }, [lat, lng, radius, limit, budget]);

  const subtitle = useMemo(() => {
    const parts = [`${cafes.length} spots within ${(radius / 1000).toFixed(1)} km`];
    if (budget) parts.push(`under ₹${budget} budget`);
    return parts.join(" · ");
  }, [cafes.length, radius, budget]);

  return (
    <div className="rounded-3xl border border-primary/10 bg-card overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">
            Cafés near <span className="text-primary">{label}</span>
          </p>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <ul className="divide-y divide-border/60">
        {error && (
          <li className="px-5 py-8 text-center text-sm text-destructive">{error}</li>
        )}

        {!loading && !error && cafes.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground">
            No cafés found here within your budget. Try a wider radius or higher budget.
          </li>
        )}

        {loading && cafes.length === 0 && Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="px-5 py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full animate-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 rounded animate-shimmer" />
              <div className="h-3 w-1/3 rounded animate-shimmer" />
            </div>
          </li>
        ))}

        {cafes.map((c, i) => (
          <li key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-accent/30 transition">
            <div className="h-10 w-10 rounded-full bg-primary-soft/60 flex items-center justify-center text-primary shrink-0">
              <Coffee className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground tabular-nums">{i + 1}.</span>
                <span className="text-sm font-medium truncate">{c.name}</span>
                {c.priceLevel != null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-soft/40 text-secondary-foreground">
                    {priceDots(c.priceLevel)}
                  </span>
                )}
                {c.openNow === true && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">Open</span>
                )}
                {c.openNow === false && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Closed</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[260px]">{c.address}</span>
                {c.rating != null && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-current text-amber-500" />
                    {c.rating.toFixed(1)} {c.reviews ? `(${c.reviews})` : ""}
                  </span>
                )}
              </div>
            </div>
            <a
              href={c.mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition shrink-0"
            >
              <ExternalLink className="h-3 w-3" /> Open
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NearbyCafes;
