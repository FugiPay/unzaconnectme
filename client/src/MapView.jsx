import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { pinLabel } from "./util.js";

// Small labelled pin: gold tag with the venue code, pointing at the exact spot
function pinIcon(v) {
  const tag = document.createElement("span");
  tag.className = "pin-label";
  tag.textContent = pinLabel(v);
  return L.divIcon({ className: "pin", html: tag, iconSize: [0, 0] });
}
export const DEFAULT_CENTER = [-15.3885, 28.3345];

function popupFor(v, onOpen) {
  // built with DOM nodes (not HTML strings) so venue text can never inject markup
  const box = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = v.name;
  const line = document.createElement("div");
  line.textContent = [v.building, v.floor && `${v.floor} floor`].filter(Boolean).join(", ");
  const link = document.createElement("a");
  link.href = `https://www.google.com/maps?q=${v.lat},${v.lng}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "Open in Maps";
  link.addEventListener("click", () => onOpen?.(v));
  box.append(title, line, link);
  return box;
}

export default function MapView({ venues, campuses = [], onViewVenue }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const map = L.map(elRef.current).setView(DEFAULT_CENTER, 16);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    layer.clearLayers();
    const points = [];
    venues.forEach((v) => {
      if (v.lat == null || v.lng == null) return;
      const marker = L.marker([v.lat, v.lng], { icon: pinIcon(v), title: v.name, keyboard: true }).bindPopup(popupFor(v, onViewVenue), { offset: [0, -24] });
      marker.on("popupopen", () => onViewVenue?.(v));
      layer.addLayer(marker);
      points.push([v.lat, v.lng]);
    });
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 17 });
    else {
      const c = campuses.find((x) => x.lat != null && x.lng != null);
      if (c) map.setView([c.lat, c.lng], 16);
    }
  }, [venues, campuses]);

  return <div ref={elRef} className="map" role="region" aria-label="Campus map" />;
}
