import { describe, expect, it } from "vitest";
import { directionsUrl } from "./itineraryMap";
import type { Plan } from "./api";

const plan: Plan = { id: "test", title: "Date", budget: 1000, currency: "₹", mood: "romantic", location: "Bengaluru", totalCost: 500, createdAt: "",
  itinerary: [{ time: "5 PM", place: "Cafe & Co", activity: "Coffee", cost: 200 }, { time: "6 PM", place: "Cubbon Park", activity: "Walk", cost: 0 }] };
describe("itinerary directions", () => {
  it("keeps the itinerary order and handles venue punctuation", () => {
    const url = new URL(directionsUrl(plan, 1, "WALK"));
    expect(url.searchParams.get("origin")).toBe("Cafe & Co, Bengaluru");
    expect(url.searchParams.get("destination")).toBe("Cubbon Park, Bengaluru");
    expect(url.searchParams.get("travelmode")).toBe("walking");
  });
  it("starts at live coordinates when supplied", () => {
    const url = new URL(directionsUrl(plan, 1, "DRIVE", undefined, { lat: 12, lng: 77 }));
    expect(url.searchParams.get("origin")).toBe("12,77");
    expect(url.searchParams.get("travelmode")).toBe("driving");
  });
  it("uses resolved venue IDs without inventing a first origin", () => {
    const url = new URL(directionsUrl(plan, 0, "WALK", [{ index: 0, name: "Cafe", address: "Exact street", placeId: "abc" }]));
    expect(url.searchParams.get("destination_place_id")).toBe("abc");
    expect(url.searchParams.has("origin")).toBe(false);
  });
});