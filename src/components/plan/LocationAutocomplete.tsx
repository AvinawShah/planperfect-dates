import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { popularCities, searchAreas, type AreaSuggestion } from "@/lib/locations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value: AreaSuggestion | null;
  onChange: (a: AreaSuggestion) => void;
}

interface GPrediction {
  placeId: string;
  text: string;
  main: string;
  secondary: string;
}

const LocationAutocomplete = ({ value, onChange }: Props) => {
  const [query, setQuery] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [activeCity, setActiveCity] = useState<string>("Bengaluru");
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [gResults, setGResults] = useState<GPrediction[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const reqRef = useRef(0);

  // Debounced Google Places autocomplete
  useEffect(() => {
    const q = query.trim();
    if (!q || (value && q === value.label)) {
      setGResults([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const myReq = ++reqRef.current;
      setSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke("places", {
          body: { action: "autocomplete", input: q },
        });
        if (myReq !== reqRef.current) return;
        if (error) throw error;
        setGResults(data?.predictions ?? []);
      } catch (e) {
        console.warn("autocomplete failed", e);
      } finally {
        if (myReq === reqRef.current) setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, value]);

  async function pickPrediction(p: GPrediction) {
    try {
      const { data, error } = await supabase.functions.invoke("places", {
        body: { action: "details", placeId: p.placeId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const picked: AreaSuggestion = {
        city: data.city || p.secondary || "",
        area: data.name || p.main,
        label: data.address || p.text,
        lat: data.lat,
        lng: data.lng,
        blurb: data.address || "",
        tags: ["google"],
      };
      onChange(picked);
      setQuery(picked.label);
      setOpen(false);
    } catch (e) {
      toast.error("Couldn't load that place. Try another.");
      console.warn(e);
    }
  }

  async function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation isn't supported by your browser.");
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }),
      );
      const { latitude: lat, longitude: lng } = pos.coords;

      const { data, error } = await supabase.functions.invoke("places", {
        body: { action: "reverse", lat, lng },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const picked: AreaSuggestion = {
        city: data.city || "",
        area: data.area || "Current location",
        label: data.label,
        lat: data.lat,
        lng: data.lng,
        blurb: "Detected from your device location",
        tags: ["nearby"],
      };
      onChange(picked);
      setQuery(picked.label);
      setOpen(false);
      toast.success(`Using your location — ${picked.area}`);
    } catch (err) {
      const msg = (err as Error)?.message || "Couldn't get your location.";
      toast.error(msg);
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    if (value) setQuery(value.label);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const cityResults = useMemo(
    () => searchAreas("", 100).filter((a) => a.city === activeCity),
    [activeCity],
  );

  const showSearch = query.trim().length > 0 && (!value || query !== value.label);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-primary" /> Where?
        </label>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          placeholder="Search any address, neighborhood, or landmark…"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="w-full rounded-xl border border-border bg-background pl-9 pr-9 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        {searching && (
          <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setGResults([]); setOpen(true); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-border bg-popover shadow-glow overflow-hidden">
          {!showSearch && (
            <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-border bg-card/50">
              {popularCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCity(c)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs transition ${
                    activeCity === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <ul className="max-h-72 overflow-y-auto py-1">
            {showSearch && gResults.length === 0 && !searching && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No matches. Try a different query.
              </li>
            )}

            {showSearch && gResults.map((p) => (
              <li key={p.placeId}>
                <button
                  type="button"
                  onClick={() => pickPrediction(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-accent/40 transition flex items-start gap-3"
                >
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.main}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.secondary}</div>
                  </div>
                </button>
              </li>
            ))}

            {!showSearch && cityResults.map((a) => (
              <li key={a.label}>
                <button
                  type="button"
                  onClick={() => { onChange(a); setQuery(a.label); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-accent/40 transition flex items-start gap-3"
                >
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{a.area}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.blurb}</div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{a.city}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
