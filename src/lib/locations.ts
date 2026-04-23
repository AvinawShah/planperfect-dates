// Curated cities + popular date areas for autocomplete.
// Frontend-only — fast, no API key needed. Latitudes/longitudes approximate area centers.

export interface AreaSuggestion {
  city: string;
  area: string;
  label: string;       // "Indiranagar, Bengaluru"
  lat: number;
  lng: number;
  blurb: string;       // short vibe blurb
  tags: string[];      // for chip hints
}

export const cityAreas: AreaSuggestion[] = [
  // Bengaluru
  { city: "Bengaluru", area: "Indiranagar", label: "Indiranagar, Bengaluru", lat: 12.9719, lng: 77.6412, blurb: "Buzzy bars, indie cafés, late-night eats", tags: ["lively", "foodie", "bars"] },
  { city: "Bengaluru", area: "Koramangala", label: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245, blurb: "Brunches, breweries, board game cafés", tags: ["brunch", "lively", "playful"] },
  { city: "Bengaluru", area: "MG Road", label: "MG Road, Bengaluru", lat: 12.9756, lng: 77.6050, blurb: "Classic city center — cinema, walks, bars", tags: ["walk", "cinema", "central"] },
  { city: "Bengaluru", area: "Jayanagar", label: "Jayanagar, Bengaluru", lat: 12.9250, lng: 77.5938, blurb: "Old-school South Indian charm, dosas at dawn", tags: ["foodie", "chill"] },
  { city: "Bengaluru", area: "Whitefield", label: "Whitefield, Bengaluru", lat: 12.9698, lng: 77.7500, blurb: "Tech crowd hangouts, malls, breweries", tags: ["mall", "brewery"] },
  { city: "Bengaluru", area: "Cubbon Park", label: "Cubbon Park, Bengaluru", lat: 12.9763, lng: 77.5929, blurb: "Sunset walks under rain trees", tags: ["walk", "outdoors", "romantic"] },

  // Mumbai
  { city: "Mumbai", area: "Bandra", label: "Bandra, Mumbai", lat: 19.0596, lng: 72.8295, blurb: "Sea-facing cafés, Carter Road sunsets", tags: ["sea", "lively", "foodie"] },
  { city: "Mumbai", area: "Marine Drive", label: "Marine Drive, Mumbai", lat: 18.9438, lng: 72.8231, blurb: "Queen's necklace at golden hour", tags: ["walk", "romantic", "outdoors"] },
  { city: "Mumbai", area: "Colaba", label: "Colaba, Mumbai", lat: 18.9067, lng: 72.8147, blurb: "Heritage cafés, Gateway, art galleries", tags: ["cultural", "walk"] },
  { city: "Mumbai", area: "Powai", label: "Powai, Mumbai", lat: 19.1197, lng: 72.9051, blurb: "Lakeside dining, quieter vibe", tags: ["chill", "lake"] },
  { city: "Mumbai", area: "Andheri West", label: "Andheri West, Mumbai", lat: 19.1364, lng: 72.8296, blurb: "Comedy, theatre, street food", tags: ["comedy", "theatre", "playful"] },

  // Delhi
  { city: "Delhi", area: "Hauz Khas Village", label: "Hauz Khas Village, Delhi", lat: 28.5535, lng: 77.1944, blurb: "Lake views, indie bars, art shops", tags: ["bars", "art", "lively"] },
  { city: "Delhi", area: "Connaught Place", label: "Connaught Place, Delhi", lat: 28.6315, lng: 77.2167, blurb: "Iconic circles, classic restaurants", tags: ["central", "foodie"] },
  { city: "Delhi", area: "Khan Market", label: "Khan Market, Delhi", lat: 28.6005, lng: 77.2273, blurb: "Bookshops, bakeries, easy strolls", tags: ["chill", "books", "cafe"] },
  { city: "Delhi", area: "Lodhi Gardens", label: "Lodhi Gardens, Delhi", lat: 28.5933, lng: 77.2197, blurb: "Mughal ruins, picnic blankets", tags: ["outdoors", "romantic", "walk"] },
  { city: "Delhi", area: "Cyber Hub", label: "Cyber Hub, Gurugram", lat: 28.4955, lng: 77.0890, blurb: "Open-air F&B promenade", tags: ["foodie", "lively"] },

  // Hyderabad
  { city: "Hyderabad", area: "Jubilee Hills", label: "Jubilee Hills, Hyderabad", lat: 17.4309, lng: 78.4078, blurb: "Upscale cafés, rooftops with skyline views", tags: ["rooftop", "romantic"] },
  { city: "Hyderabad", area: "Banjara Hills", label: "Banjara Hills, Hyderabad", lat: 17.4156, lng: 78.4347, blurb: "Boutique restaurants and old hotels", tags: ["foodie", "chill"] },
  { city: "Hyderabad", area: "Hussain Sagar", label: "Hussain Sagar, Hyderabad", lat: 17.4239, lng: 78.4738, blurb: "Lakeside walks, Buddha statue", tags: ["walk", "lake"] },

  // Goa
  { city: "Goa", area: "Anjuna", label: "Anjuna, Goa", lat: 15.5736, lng: 73.7400, blurb: "Beach shacks, sunset trance", tags: ["beach", "lively"] },
  { city: "Goa", area: "Panaji", label: "Panaji, Goa", lat: 15.4909, lng: 73.8278, blurb: "Latin quarters, Mandovi cruises", tags: ["cultural", "walk"] },
  { city: "Goa", area: "Palolem", label: "Palolem, Goa", lat: 15.0099, lng: 74.0233, blurb: "Quiet south beach, kayaks at dusk", tags: ["beach", "chill", "outdoors"] },

  // Pune
  { city: "Pune", area: "Koregaon Park", label: "Koregaon Park, Pune", lat: 18.5362, lng: 73.8939, blurb: "Tree-lined cafés, German Bakery", tags: ["cafe", "chill"] },
  { city: "Pune", area: "Viman Nagar", label: "Viman Nagar, Pune", lat: 18.5679, lng: 73.9143, blurb: "Mall hangouts, Phoenix marketcity", tags: ["mall", "playful"] },

  // Chennai
  { city: "Chennai", area: "Besant Nagar", label: "Besant Nagar, Chennai", lat: 13.0067, lng: 80.2607, blurb: "Elliot's Beach, masala dosas at midnight", tags: ["beach", "foodie"] },
  { city: "Chennai", area: "Nungambakkam", label: "Nungambakkam, Chennai", lat: 13.0596, lng: 80.2426, blurb: "Cafés, bookshops, art galleries", tags: ["cafe", "art", "chill"] },

  // Kolkata
  { city: "Kolkata", area: "Park Street", label: "Park Street, Kolkata", lat: 22.5530, lng: 88.3514, blurb: "Old-world bars, jazz nights", tags: ["bars", "cultural"] },
  { city: "Kolkata", area: "Princep Ghat", label: "Princep Ghat, Kolkata", lat: 22.5567, lng: 88.3306, blurb: "Hooghly riverside, evening boat rides", tags: ["river", "romantic", "outdoors"] },
];

export function searchAreas(q: string, max = 6): AreaSuggestion[] {
  const query = q.trim().toLowerCase();
  if (!query) return cityAreas.slice(0, max);
  const starts = cityAreas.filter(
    (a) => a.area.toLowerCase().startsWith(query) || a.city.toLowerCase().startsWith(query),
  );
  const contains = cityAreas.filter(
    (a) =>
      !starts.includes(a) &&
      (a.area.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query) ||
        a.label.toLowerCase().includes(query) ||
        a.tags.some((t) => t.includes(query))),
  );
  return [...starts, ...contains].slice(0, max);
}

export const popularCities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Goa", "Pune", "Chennai", "Kolkata"];
