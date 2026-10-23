sed -i 's/const start = stationLocations\[trip.departureLocation\];/const start = { lat: trip.departureLat, lng: trip.departureLng };/g' components/SearchResultsPage.tsx
sed -i 's/const end = stationLocations\[trip.arrivalLocation\];/const end = { lat: trip.arrivalLat, lng: trip.arrivalLng };/g' components/SearchResultsPage.tsx
