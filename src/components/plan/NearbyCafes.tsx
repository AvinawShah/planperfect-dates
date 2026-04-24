import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Loader2, MapPin, Navigation } from "lucide-react";
import { distanceKm } from "@/lib/locations";

interface CafeResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  cuisine?: string;
  km: number;
}

interface Props {
  lat: number;
  lng: number;
  label: string;
  radius?: number; // meters
  limit?: number;
}

async function fetchCafes(lat: number, lng: number, radius: number): Promise<Omit<CafeResult, "km">[]> {
  // Cafés + bakeries from OSM Overpass.
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="cafe"](around:${radius},${lat},${lng});
      node["shop"="bakery"](around:${radius},${lat},${lng});
    );
    out body 60;
  `.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data: { elements: Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }> } =
    await res.json();

  return data.elements
    .filter((el) => el.tags?.name)
    .map((el) => ({
      id: String(el.id),
      name: el.tags!.name,
      lat: el.lat,
      lng: el.lon,
      cuisine: el.tags!.cuisine || (el.tags!.shop === "bakery" ? "Bakery" : undefined),
    }));
}

const NearbyCafes = ({ lat, lng, label, radius = 1500, limit = 8 }: Props) => {
  const [cafes, setCafes] = useState<CafeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    const myReq = ++reqRef.current;
    setLoading(true);
    setError(null);
    fetchCafes(lat, lng, radius)
      .then((rows) => {
        if (myReq !== reqRef.current) return;
        const ranked = rows
          .map((r) => ({ ...r, km: distanceKm(lat, lng, r.lat, r.lng) }))
          .sort((a, b) => a.km - b.km)
          .slice(0, limit);
        setCafes(ranked);
      })
      .catch((e) => {
        if (myReq !== reqRef.current) return;
        console.warn(e);
        setError("Couldn't load cafés right now. Try again in a moment.");
      })
      .finally(() => {
        if (myReq === reqRef.current) setLoading(false);
      });
  }, [lat, lng, radius, limit]);

  const subtitle = useMemo(
    () => `${cafes.length} closest spots within ${(radius / 1000).toFixed(1)} km`,
    [cafes.length, radius],
  );

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
        {!loading && cafes.length === 0 && !error && (
          <li className="px-5 py-8 text-center text-sm text-muted-foreground">
            No cafés tagged in OSM here yet — try a different area.
          </li>
        )}

        {error && (
          <li className="px-5 py-8 text-center text-sm text-destructive">{error}</li>
        )}

        {loading && cafes.length === 0 && (
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="px-5 py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full animate-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/2 rounded animate-shimmer" />
                <div className="h-3 w-1/3 rounded animate-shimmer" />
              </div>
            </li>
          ))
        )}

        {cafes.map((c, i) => (
          <li key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-accent/30 transition">
            <div className="h-10 w-10 rounded-full bg-primary-soft/60 flex items-center justify-center text-primary shrink-0">
              <Coffee className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-mono text-muted-foreground tabular-nums">{i + 1}.</span>
                <span className="text-sm font-medium truncate">{c.name}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <MapPin className="h-3 w-3" />
                {c.km.toFixed(2)} km away
                {c.cuisine && <span>· {c.cuisine}</span>}
              </div>
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=18/${c.lat}/${c.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition shrink-0"
            >
              <Navigation className="h-3 w-3" /> Open
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NearbyCafes;
