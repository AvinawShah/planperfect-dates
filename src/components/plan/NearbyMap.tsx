import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, MapPin, Coffee, Beer, UtensilsCrossed, Trees, Film, Sparkles, Flame } from "lucide-react";

// Fix Leaflet default icon paths (Vite breaks the bundled assets)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type PlaceCategory = "cafe" | "bar" | "restaurant" | "park" | "cinema" | "spiritual";

export interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
  cuisine?: string;
  religion?: string;
}

interface Props {
  lat: number;
  lng: number;
  label: string;
  radius?: number; // meters
}

const CATEGORY_META: Record<PlaceCategory, { label: string; color: string; icon: typeof Coffee }> = {
  cafe: { label: "Cafés", color: "hsl(340 75% 55%)", icon: Coffee },
  bar: { label: "Bars & pubs", color: "hsl(280 65% 55%)", icon: Beer },
  restaurant: { label: "Restaurants", color: "hsl(20 85% 55%)", icon: UtensilsCrossed },
  park: { label: "Parks", color: "hsl(140 55% 45%)", icon: Trees },
  cinema: { label: "Cinemas", color: "hsl(220 70% 55%)", icon: Film },
  spiritual: { label: "Temples & spiritual", color: "hsl(38 90% 50%)", icon: Flame },
};

// Recenter map when the selected location changes
const Recenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
};

async function fetchNearbyPlaces(lat: number, lng: number, radius: number): Promise<NearbyPlace[]> {
  // Overpass QL — free, no key. Picks date-friendly amenities.
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"cafe|bar|pub|restaurant|cinema|place_of_worship"](around:${radius},${lat},${lng});
      node["leisure"~"park|garden"](around:${radius},${lat},${lng});
    );
    out body 80;
  `.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data: { elements: Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }> } = await res.json();

  const mapAmenity = (t?: Record<string, string>): PlaceCategory | null => {
    if (!t) return null;
    if (t.amenity === "cafe") return "cafe";
    if (t.amenity === "bar" || t.amenity === "pub") return "bar";
    if (t.amenity === "restaurant") return "restaurant";
    if (t.amenity === "cinema") return "cinema";
    if (t.amenity === "place_of_worship") return "spiritual";
    if (t.leisure === "park" || t.leisure === "garden") return "park";
    return null;
  };

  return data.elements
    .map((el) => {
      const cat = mapAmenity(el.tags);
      if (!cat || !el.tags?.name) return null;
      return {
        id: String(el.id),
        name: el.tags.name,
        lat: el.lat,
        lng: el.lon,
        category: cat,
        cuisine: el.tags.cuisine,
        religion: el.tags.religion,
      } as NearbyPlace;
    })
    .filter((p): p is NearbyPlace => p !== null);
}

const NearbyMap = ({ lat, lng, label, radius = 1200 }: Props) => {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<PlaceCategory>>(
    new Set(["cafe", "bar", "restaurant", "park", "cinema"]),
  );
  const reqRef = useRef(0);

  useEffect(() => {
    const myReq = ++reqRef.current;
    setLoading(true);
    setError(null);
    fetchNearbyPlaces(lat, lng, radius)
      .then((p) => {
        if (myReq !== reqRef.current) return;
        setPlaces(p);
      })
      .catch((e) => {
        if (myReq !== reqRef.current) return;
        console.warn(e);
        setError("Couldn't load nearby spots — Overpass may be busy. Try again in a moment.");
      })
      .finally(() => {
        if (myReq === reqRef.current) setLoading(false);
      });
  }, [lat, lng, radius]);

  const filtered = useMemo(() => places.filter((p) => activeFilters.has(p.category)), [places, activeFilters]);

  const counts = useMemo(() => {
    const c: Record<PlaceCategory, number> = { cafe: 0, bar: 0, restaurant: 0, park: 0, cinema: 0 };
    places.forEach((p) => { c[p.category]++; });
    return c;
  }, [places]);

  const toggle = (cat: PlaceCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="rounded-3xl border border-primary/10 bg-card overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">
            Nearby in <span className="text-primary">{label}</span>
          </p>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {places.length} spots within {(radius / 1000).toFixed(1)} km
        </p>
      </div>

      {/* Filter chips */}
      <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-border/60 bg-background/40">
        {(Object.keys(CATEGORY_META) as PlaceCategory[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const active = activeFilters.has(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
              <span className="opacity-60">· {counts[cat]}</span>
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="h-[420px] relative">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter lat={lat} lng={lng} />

          {/* Center marker */}
          <Marker position={[lat, lng]}>
            <Popup>
              <div className="font-medium">{label}</div>
              <div className="text-xs opacity-70">Your starting point</div>
            </Popup>
          </Marker>

          {/* Place markers */}
          {filtered.map((p) => {
            const meta = CATEGORY_META[p.category];
            return (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={8}
                pathOptions={{
                  color: meta.color,
                  fillColor: meta.color,
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs opacity-70 capitalize">
                    {meta.label.replace(/s$/, "")}
                    {p.cuisine ? ` · ${p.cuisine}` : ""}
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=18/${p.lat}/${p.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Open in maps →
                  </a>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {error && (
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-background/95 border border-destructive/30 p-3 text-xs text-destructive shadow-card">
            {error}
          </div>
        )}
        {!loading && !error && places.length === 0 && (
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-background/95 border border-border p-3 text-xs text-muted-foreground shadow-card flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            No tagged spots found here. Try a different area.
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyMap;
