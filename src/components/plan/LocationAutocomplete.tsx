import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { searchAreas, popularCities, type AreaSuggestion } from "@/lib/locations";

interface Props {
  value: AreaSuggestion | null;
  onChange: (a: AreaSuggestion) => void;
}

const LocationAutocomplete = ({ value, onChange }: Props) => {
  const [query, setQuery] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [activeCity, setActiveCity] = useState<string>("Bengaluru");
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const results = useMemo(() => searchAreas(query, 8), [query]);
  const cityResults = useMemo(
    () => searchAreas("", 100).filter((a) => a.city === activeCity),
    [activeCity],
  );

  const showSearch = query.trim().length > 0 && !value;
  const list = showSearch ? results : cityResults;

  return (
    <div ref={wrapperRef} className="relative">
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <MapPin className="h-4 w-4 text-primary" /> Where?
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          placeholder="Type a city or area…"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange({ ...value, label: "" }); // clear selection when typing
          }}
          className="w-full rounded-xl border border-border bg-background pl-9 pr-9 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setOpen(true); }}
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
            {list.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No areas found. Try another keyword.
              </li>
            )}
            {list.map((a) => (
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
                    <div className="mt-1 flex flex-wrap gap-1">
                      {a.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-soft/40 text-secondary-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
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
