import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Loader2,
  MapPin,
  Coffee,
  Beer,
  UtensilsCrossed,
  Trees,
  Film,
  Sparkles,
  Flame,
  Navigation,
  Crosshair,
  Radio,
} from "lucide-react";
import { distanceKm } from "@/lib/locations";

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
  radius?: number;
}

const CATEGORY_META: Record<
  PlaceCategory,
  { label: string; color: string; emoji: string; icon: typeof Coffee }
> = {
  cafe: { label: "Cafés", color: "#ff5d8f", emoji: "☕", icon: Coffee },
  bar: { label: "Bars", color: "#a855f7", emoji: "🍸", icon: Beer },
  restaurant: { label: "Eats", color: "#fb923c", emoji: "🍜", icon: UtensilsCrossed },
  park: { label: "Parks", color: "#22c55e", emoji: "🌳", icon: Trees },
  cinema: { label: "Cinema", color: "#3b82f6", emoji: "🎬", icon: Film },
  spiritual: { label: "Spiritual", color: "#f59e0b", emoji: "🕉️", icon: Flame },
};

// Recenter when target changes
const Recenter = ({ lat, lng, zoom = 16 }: { lat: number; lng: number; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { animate: true, duration: 1.1 });
  }, [lat, lng, zoom, map]);
  return null;
};

// Build a Snapchat-style "bitmoji" divIcon for a place
const placeIcon = (cat: PlaceCategory) => {
  const meta = CATEGORY_META[cat];
  return L.divIcon({
    className: "snap-place-icon",
    html: `
      <div class="snap-bubble" style="--bubble:${meta.color}">
        <span class="snap-bubble-emoji">${meta.emoji}</span>
        <span class="snap-bubble-tail" style="--bubble:${meta.color}"></span>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -46],
  });
};

// Live "you are here" pulsing avatar
const meIcon = () =>
  L.divIcon({
    className: "snap-me-icon",
    html: `
      <div class="snap-me">
        <span class="snap-me-pulse"></span>
        <span class="snap-me-pulse snap-me-pulse--delay"></span>
        <span class="snap-me-dot">
          <span class="snap-me-emoji">🧍</span>
        </span>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });

async function fetchNearbyPlaces(lat: number, lng: number, radius: number): Promise<NearbyPlace[]> {
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
  const data: {
    elements: Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }>;
  } = await res.json();

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

const NearbyMap = ({ lat, lng, label, radius = 1500 }: Props) => {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<PlaceCategory>>(
    new Set(["cafe", "bar", "restaurant", "park", "cinema", "spiritual"]),
  );

  // Live geolocation
  const [livePos, setLivePos] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "watching" | "denied" | "unsupported" | "error">(
    "idle",
  );
  const [followMe, setFollowMe] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const reqRef = useRef(0);

  // Use live position if available; otherwise fall back to provided coords
  const center = livePos ?? { lat, lng, acc: 0 };

  // Start watching geolocation on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("watching");
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setLivePos({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          acc: p.coords.accuracy ?? 0,
        });
      },
      (err) => {
        console.warn("geo error", err);
        setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    watchIdRef.current = id;
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Fetch places around the active center (live position preferred)
  useEffect(() => {
    const myReq = ++reqRef.current;
    setLoading(true);
    setError(null);
    fetchNearbyPlaces(center.lat, center.lng, radius)
      .then((p) => {
        if (myReq !== reqRef.current) return;
        setPlaces(p);
      })
      .catch((e) => {
        if (myReq !== reqRef.current) return;
        console.warn(e);
        setError("Couldn't load nearby spots — try again in a moment.");
      })
      .finally(() => {
        if (myReq === reqRef.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat.toFixed(3), center.lng.toFixed(3), radius]);

  const filtered = useMemo(
    () =>
      places
        .filter((p) => activeFilters.has(p.category))
        .map((p) => ({ ...p, km: distanceKm(center.lat, center.lng, p.lat, p.lng) }))
        .sort((a, b) => a.km - b.km),
    [places, activeFilters, center.lat, center.lng],
  );

  const counts = useMemo(() => {
    const c: Record<PlaceCategory, number> = {
      cafe: 0, bar: 0, restaurant: 0, park: 0, cinema: 0, spiritual: 0,
    };
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

  const liveLabel =
    geoStatus === "watching" && livePos
      ? "Live location"
      : geoStatus === "denied"
        ? "Location blocked — using area"
        : geoStatus === "unsupported"
          ? "GPS unsupported — using area"
          : geoStatus === "error"
            ? "Can't get GPS — using area"
            : "Locating…";

  return (
    <div className="rounded-3xl border border-primary/10 bg-card overflow-hidden shadow-card">
      {/* Snap-style scoped CSS */}
      <style>{`
        .snap-place-icon { background: transparent !important; border: none !important; }
        .snap-bubble {
          position: relative; width: 44px; height: 44px; border-radius: 50%;
          background: var(--bubble);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 20px; font-weight: 700;
          box-shadow:
            0 0 0 3px rgba(255,255,255,0.95),
            0 8px 22px -6px color-mix(in oklab, var(--bubble) 70%, black 0%),
            0 2px 6px rgba(0,0,0,0.18);
          transform: translateY(0);
          transition: transform .25s cubic-bezier(.2,.9,.3,1.4);
          animation: snap-pop .35s cubic-bezier(.2,.9,.3,1.6) both;
        }
        .snap-bubble:hover { transform: translateY(-4px) scale(1.08); }
        .snap-bubble-emoji {
          line-height: 1; filter: drop-shadow(0 1px 1px rgba(0,0,0,.25));
        }
        .snap-bubble-tail {
          position: absolute; left: 50%; bottom: -6px; transform: translateX(-50%) rotate(45deg);
          width: 12px; height: 12px; background: var(--bubble);
          border-bottom-right-radius: 3px;
          box-shadow: 2px 2px 0 rgba(255,255,255,0.95);
        }
        @keyframes snap-pop {
          0% { transform: scale(.2) translateY(-12px); opacity: 0; }
          70% { transform: scale(1.15) translateY(0); opacity: 1; }
          100% { transform: scale(1); }
        }

        .snap-me-icon { background: transparent !important; border: none !important; }
        .snap-me { position: relative; width: 56px; height: 56px; }
        .snap-me-dot {
          position: absolute; inset: 14px; border-radius: 50%;
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 4px white, 0 6px 18px rgba(59,130,246,0.5);
          z-index: 2;
        }
        .snap-me-emoji { font-size: 16px; }
        .snap-me-pulse {
          position: absolute; inset: 0; border-radius: 50%;
          background: rgba(59,130,246,0.35);
          animation: snap-pulse 2.2s ease-out infinite;
        }
        .snap-me-pulse--delay { animation-delay: 1.1s; }
        @keyframes snap-pulse {
          0% { transform: scale(.4); opacity: .8; }
          80% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        /* Snapchat-y stylized basemap: warm, pastel, slightly desaturated */
        .snap-tiles {
          filter: saturate(1.05) contrast(.95) brightness(1.02) hue-rotate(-6deg);
        }
        .leaflet-container { background: #f3ecdf; font-family: inherit; }
        .leaflet-popup-content-wrapper {
          border-radius: 18px; padding: 4px 6px;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.25);
        }
        .leaflet-popup-tip { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .leaflet-control-zoom a {
          border-radius: 12px !important; border: none !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
          background: white !important; color: #111 !important;
        }
      `}</style>

      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">
            Hangout map · <span className="text-primary">{label}</span>
          </p>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              geoStatus === "watching" && livePos
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
                : "border-border text-muted-foreground"
            }`}
          >
            <Radio className={`h-3 w-3 ${geoStatus === "watching" && livePos ? "animate-pulse" : ""}`} />
            {liveLabel}
          </span>
          <span className="text-muted-foreground hidden sm:inline">
            {filtered.length}/{places.length} spots · {(radius / 1000).toFixed(1)} km
          </span>
        </div>
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
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 hover:scale-105 ${
                active
                  ? "border-transparent text-white shadow-md"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
              style={active ? { backgroundColor: meta.color } : undefined}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
              <span className="opacity-80">· {counts[cat]}</span>
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="h-[480px] relative">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={16}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Stylized warm basemap (CartoDB Voyager) */}
          <TileLayer
            attribution='&copy; OpenStreetMap, &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            className="snap-tiles"
          />
          <ZoomControl position="bottomright" />

          {followMe && <Recenter lat={center.lat} lng={center.lng} />}

          {/* Live "me" marker */}
          <Marker position={[center.lat, center.lng]} icon={meIcon()}>
            <Popup>
              <div className="font-semibold">You're here</div>
              <div className="text-xs opacity-70">
                {geoStatus === "watching" && livePos
                  ? `Accuracy ±${Math.round(livePos.acc)}m`
                  : "Approximate area"}
              </div>
            </Popup>
          </Marker>

          {/* Place markers as Snap-style bubbles */}
          {filtered.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={placeIcon(p.category)}>
              <Popup>
                <div className="font-semibold flex items-center gap-1.5">
                  <span>{CATEGORY_META[p.category].emoji}</span>
                  {p.name}
                </div>
                <div className="text-xs opacity-70 capitalize mt-0.5">
                  {CATEGORY_META[p.category].label.replace(/s$/, "")}
                  {p.cuisine ? ` · ${p.cuisine}` : ""}
                  {" · "}
                  {p.km.toFixed(2)} km away
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=18/${p.lat}/${p.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1.5 inline-flex items-center gap-1"
                >
                  <Navigation className="h-3 w-3" /> Open in maps
                </a>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating "recenter on me" button */}
        <button
          type="button"
          onClick={() => setFollowMe((v) => !v)}
          className={`absolute top-4 right-4 z-[1000] inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium shadow-lg backdrop-blur transition ${
            followMe
              ? "bg-primary text-primary-foreground"
              : "bg-background/95 text-foreground border border-border hover:bg-background"
          }`}
        >
          <Crosshair className={`h-3.5 w-3.5 ${followMe ? "animate-pulse" : ""}`} />
          {followMe ? "Following you" : "Recenter"}
        </button>

        {/* Live status pill */}
        <div className="absolute top-4 left-4 z-[1000] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-background/90 backdrop-blur border border-border shadow-md">
          <span
            className={`h-2 w-2 rounded-full ${
              geoStatus === "watching" && livePos ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
            }`}
          />
          {filtered.length} spots nearby
        </div>

        {error && (
          <div className="absolute inset-x-4 bottom-4 z-[1000] rounded-xl bg-background/95 border border-destructive/30 p-3 text-xs text-destructive shadow-card">
            {error}
          </div>
        )}
        {!loading && !error && places.length === 0 && (
          <div className="absolute inset-x-4 bottom-4 z-[1000] rounded-xl bg-background/95 border border-border p-3 text-xs text-muted-foreground shadow-card flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            No tagged spots found here yet — try moving the area.
          </div>
        )}
      </div>

      {/* Geo permission hint */}
      {(geoStatus === "denied" || geoStatus === "unsupported") && (
        <div className="px-5 py-3 text-xs text-muted-foreground bg-background/40 border-t border-border/60">
          Tip: enable location access in your browser to see your live position and get more accurate
          nearby spots.
        </div>
      )}
    </div>
  );
};

export default NearbyMap;
