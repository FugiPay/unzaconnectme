import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_CENTER } from "./MapView.jsx";

// Click anywhere on the map to set the point.
export default function MapPicker({ lat, lng, center, onChange }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const hasPoint = lat != null && lat !== "" && lng != null && lng !== "";
    const start = hasPoint ? [Number(lat), Number(lng)] : center || DEFAULT_CENTER;
    const map = L.map(elRef.current).setView(start, 17);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    map.on("click", (e) => onChangeRef.current(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)));
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (lat != null && lat !== "" && lng != null && lng !== "" && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      markerRef.current = L.circleMarker([Number(lat), Number(lng)], {
        radius: 10, color: "#111111", weight: 2, fillColor: "#D92020", fillOpacity: 1,
      }).addTo(map);
      if (!map.getBounds().contains(markerRef.current.getLatLng())) map.panTo(markerRef.current.getLatLng());
    }
  }, [lat, lng]);

  return <div ref={elRef} className="map picker" role="region" aria-label="Click the map to set the location" />;
}
