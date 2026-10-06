# Architecture rules
- Keep itinerary mapping in a dedicated component mounted by ItineraryView so saved and generated plans share navigation.
- Resolve itinerary venues and calculate road routes in an authenticated Cloud function through the Google Maps connector; browser credentials are used only for map rendering.
- Cache bounded itinerary lookup results by authenticated user and request to avoid repeated billable calls; never invent coordinates for unresolved stops.