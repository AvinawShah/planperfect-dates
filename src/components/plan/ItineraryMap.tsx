import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Car, Footprints, LocateFixed, Maximize, Navigation, Loader2, ArrowLeft, ArrowRight, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/api";
import { directionsUrl, fetchItineraryRoute, loadGoogleMaps, type ItineraryRoute, type TravelMode } from "@/lib/itineraryMap";

const stickers = ["☕", "🌳", "🍜", "🎭", "🍦", "🌙", "💐", "🎉"];
export default function ItineraryMap({ plan }: { plan: Plan }) {
  const [mode, setMode] = useState<TravelMode>("WALK");
  const [route, setRoute] = useState<ItineraryRoute | null>(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const bounds = useRef<google.maps.LatLngBounds | null>(null);
  const request = useRef(0);
  const watch = useRef<number | null>(null);
  const signature = JSON.stringify([plan.location, plan.itinerary]);

  useEffect(() => {
    request.current++;
    setRoute(null); setError(""); setLoading(false); setSelected(0);
    return () => { request.current++; };
  }, [signature]);
  useEffect(() => () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
  }, []);

  async function load(nextMode = mode) {
    const id = ++request.current;
    setMode(nextMode); setLoading(true); setError("");
    try {
      await loadGoogleMaps();
      const data = await fetchItineraryRoute(plan, nextMode);
      if (id === request.current) setRoute(data);
    } catch (e) {
      if (id === request.current) setError(e instanceof Error ? e.message : "Could not load your map.");
    } finally { if (id === request.current) setLoading(false); }
  }

  useEffect(() => {
    if (!route || !container.current || !window.google?.maps?.Map) return;
    const css = getComputedStyle(document.documentElement);
    const color = (token: string) => `hsl(${css.getPropertyValue(token).trim()})`;
    const root = container.current;
    const instance = new google.maps.Map(root, {
      center: { lat: 20.5937, lng: 78.9629 }, zoom: 5, clickableIcons: false,
      disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative",
      styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] }],
    });
    map.current = instance;
    const fit = new google.maps.LatLngBounds();
    const markers: google.maps.Marker[] = [];
    const labels: HTMLDivElement[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    const resolved = route.stops.filter(s => s.lat !== undefined && s.lng !== undefined);
    for (const stop of resolved) {
      if (stop.lat === undefined || stop.lng === undefined) continue;
      const position = { lat: stop.lat, lng: stop.lng };
      fit.extend(position);
      const marker = new google.maps.Marker({ position, map: instance, title: `${stop.index + 1}. ${stop.name}`,
        label: { text: plan.itinerary[stop.index]?.emoji || stickers[stop.index % stickers.length], fontSize: "25px" },
        icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: color("--card"), fillOpacity: 1,
          strokeColor: color(stop.index % 2 ? "--sky" : "--primary"), strokeWeight: 4, scale: 23 },
      });
      markers.push(marker);
      listeners.push(marker.addListener("click", () => { setSelected(stop.index); instance.panTo(position); }));
      // App-owned number stickers stay keyboard accessible alongside emoji markers.
      const overlay = new google.maps.OverlayView();
      let node: HTMLDivElement | null = null;
      overlay.onAdd = () => {
        node = document.createElement("div");
        node.className = "itinerary-map-sticker";
        node.textContent = `${stop.index + 1}`;
        overlay.getPanes()?.overlayLayer.appendChild(node);
        labels.push(node);
      };
      overlay.draw = () => {
        const pixel = overlay.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(position));
        if (node && pixel) { node.style.left = `${pixel.x + 12}px`; node.style.top = `${pixel.y - 32}px`; }
      };
      overlay.onRemove = () => { node?.remove(); };
      overlay.setMap(instance);
      listeners.push(instance.addListener("idle", () => overlay.draw()));
    }
    bounds.current = resolved.length ? fit : null;
    if (resolved.length > 1) instance.fitBounds(fit, 65);
    else if (resolved.length === 1) { instance.fitBounds(fit); listeners.push(google.maps.event.addListenerOnce(instance, "idle", () => instance.setZoom(16))); }
    let line: google.maps.Polyline | null = null;
    if (route.encodedPolyline) {
      line = new google.maps.Polyline({ map: instance,
        path: google.maps.geometry.encoding.decodePath(route.encodedPolyline),
        strokeColor: color("--primary"), strokeWeight: 5, strokeOpacity: 0.85,
        icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: color("--primary") }, repeat: "90px" }],
      });
    }
    return () => {
      markers.forEach(marker => marker.setMap(null)); line?.setMap(null);
      listeners.forEach(listener => listener.remove()); labels.forEach(label => label.remove());
      google.maps.event.clearInstanceListeners(instance); root.replaceChildren(); map.current = null;
    };
  }, [route, signature]);

  useEffect(() => {
    const stop = route?.stops.find(s => s.index === selected);
    if (stop?.lat !== undefined && stop.lng !== undefined) map.current?.panTo({ lat: stop.lat, lng: stop.lng });
  }, [selected, route]);
  useEffect(() => {
    if (!live || !map.current || !window.google?.maps?.Map) return;
    const css = getComputedStyle(document.documentElement);
    const marker = new google.maps.Marker({ map: map.current, position: live, title: "Your live location",
      label: { text: "💑", fontSize: "25px" }, icon: { path: google.maps.SymbolPath.CIRCLE,
        scale: 24, fillColor: `hsl(${css.getPropertyValue("--sky")})`, fillOpacity: 1, strokeWeight: 3,
        strokeColor: `hsl(${css.getPropertyValue("--card")})` } });
    return () => marker.setMap(null);
  }, [live, route]);

  function locate() {
    setGeoError("");
    if (!navigator.geolocation) { setGeoError("Your browser does not support location. Directions still work from your planned stops."); return; }
    if (live) { map.current?.panTo(live); return; }
    if (watch.current !== null) return;
    setLocating(true);
    watch.current = navigator.geolocation.watchPosition(position => {
      const next = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
      setLive(next); setLocating(false);
    }, e => {
      setLocating(false);
      setGeoError(e.code === 1 ? "Location access is blocked. Allow it in your browser, or navigate from the previous stop." : "Could not get your location. You can still navigate between stops.");
      if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
  }

  const item = plan.itinerary[selected];
  if (!item) return null;
  const stop = route?.stops.find(s => s.index === selected);
  const leg = selected > 0 ? route?.legs[selected - 1] : undefined;
  const oversized = plan.itinerary.length > 8;
  return (
    <section className="border-t border-border" aria-label="Itinerary navigation map">
      <div className="p-5 sm:p-6 bg-gradient-blossom flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Your date, on the map 🧭</p>
          <h3 className="text-2xl mt-1">A little adventure together 💕</h3></div>
        <div className="flex gap-1 bg-card p-1 rounded-lg border border-border" role="group" aria-label="Travel mode">
          <Button size="sm" variant={mode === "WALK" ? "default" : "ghost"} aria-pressed={mode === "WALK"} disabled={loading} onClick={() => route ? void load("WALK") : setMode("WALK")}><Footprints className="h-4 w-4" /> Walk</Button>
          <Button size="sm" variant={mode === "DRIVE" ? "default" : "ghost"} aria-pressed={mode === "DRIVE"} disabled={loading} onClick={() => route ? void load("DRIVE") : setMode("DRIVE")}><Car className="h-4 w-4" /> Drive</Button>
        </div>
      </div>
      <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-border bg-card" aria-label="Planned stops">
        {plan.itinerary.map((it, i) => <Button key={i} variant={selected === i ? "soft" : "ghost"} size="sm" aria-pressed={selected === i} onClick={() => setSelected(i)} className="shrink-0">
          <span>{it.emoji || stickers[i % stickers.length]}</span> {i + 1} · {it.time}
        </Button>)}
      </div>
      <div className="relative h-[380px] sm:h-[440px] bg-muted">
        <div ref={container} className="absolute inset-0" aria-label="Google itinerary map" />
        {!route && <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-mint-rose gap-4">
          <div className="flex items-center gap-4 text-4xl" aria-hidden><span className="itinerary-emoji-float">☕</span><span className="text-xl">➜</span><span>🌳</span><span className="text-xl">➜</span><span className="itinerary-emoji-float">🍜</span></div>
          <p className="font-serif text-3xl">{plan.itinerary.length} stops. One lovely date.</p>
          <Button onClick={() => void load()} disabled={loading || oversized}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
            {loading ? "Finding your stops…" : "Show my date map"}
          </Button>
          {oversized && <p className="text-sm">Maps support up to eight stops. Individual directions are available below.</p>}
        </div>}
        {route && <div className="absolute top-3 right-3 flex gap-2">
          <Button variant="outline" size="icon" title="Fit all stops" aria-label="Fit all stops" onClick={() => { if (bounds.current) map.current?.fitBounds(bounds.current, 65); }}><Maximize className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" title="My live location" aria-label="My live location" disabled={locating} onClick={locate}>{locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}</Button>
        </div>}
        {loading && route && <div className="absolute top-3 left-3 bg-card rounded-lg px-3 py-2 text-xs flex gap-2 items-center shadow-soft"><Loader2 className="h-3 w-3 animate-spin" /> Updating route…</div>}
        {live && route && <span className="absolute left-3 top-3 bg-card rounded-lg text-xs px-3 py-2">💑 Live · ±{Math.round(live.accuracy)} m</span>}
      </div>
      {(error || geoError || route?.routeMessage) && <div role="status" className="px-5 py-3 text-sm bg-muted border-t border-border">
        {error || geoError || route?.routeMessage}
        {error.includes("Sign in") && <Button asChild variant="link" size="sm"><Link to="/">Sign in</Link></Button>}
        {error && route && <Button variant="link" size="sm" onClick={() => void load()}>Retry</Button>}
      </div>}
      <div className="p-5 sm:p-6 bg-card">
        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0" aria-hidden>{item.emoji || stickers[selected % stickers.length]}</span>
          <div className="min-w-0 flex-1"><p className="text-primary text-xs font-semibold uppercase tracking-widest">Stop {selected + 1} · {item.time}</p>
            <h4 className="text-2xl break-words">{item.activity}</h4>
            <p className="text-sm text-muted-foreground break-words">{stop?.name || item.place}</p>
            {stop?.address && <p className="text-xs text-muted-foreground mt-1 break-words">{stop.address}</p>}
            {leg && <p className="text-sm font-medium mt-2">{mode === "WALK" ? "🚶" : "🚗"} {Math.ceil(leg.seconds / 60)} min · {(leg.distanceMeters / 1000).toFixed(1)} km from stop {selected}</p>}
            {route && stop?.lat === undefined && <p className="text-xs text-destructive mt-1">Exact venue not found — confirm it in Google Maps.</p>}
          </div>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
          <div className="flex gap-2"><Button size="icon" variant="outline" aria-label="Previous stop" title="Previous stop" disabled={selected === 0} onClick={() => setSelected(i => i - 1)}><ArrowLeft className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" aria-label="Next stop" title="Next stop" disabled={selected === plan.itinerary.length - 1} onClick={() => setSelected(i => i + 1)}><ArrowRight className="h-4 w-4" /></Button></div>
          <Button asChild><a href={directionsUrl(plan, selected, mode, route?.stops, live || undefined)} target="_blank" rel="noopener noreferrer"><Navigation className="h-4 w-4" /> Navigate to stop {selected + 1}</a></Button>
        </div>
      </div>
    </section>
  );
}