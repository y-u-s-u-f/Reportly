import { useEffect, useRef } from "react";
import L from "leaflet";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#4f46e5;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function MiniMap({ lat, lon, interactive = false, onChange }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!ref.current || lat == null || lon == null) return;
    if (!mapRef.current) {
      mapRef.current = L.map(ref.current, {
        zoomControl: interactive,
        attributionControl: false,
        dragging: interactive,
        scrollWheelZoom: false,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        keyboard: interactive,
      }).setView([lat, lon], 16);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapRef.current);

      if (interactive) {
        mapRef.current.on("click", (e) => {
          const { lat: cLat, lng: cLon } = e.latlng;
          markerRef.current?.setLatLng([cLat, cLon]);
          onChangeRef.current?.(cLat, cLon);
        });
      }
    }

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lon], {
        icon: pinIcon,
        draggable: interactive,
      }).addTo(mapRef.current);
      if (interactive) {
        markerRef.current.on("dragend", (e) => {
          const { lat: dLat, lng: dLon } = e.target.getLatLng();
          onChangeRef.current?.(dLat, dLon);
        });
      }
    } else {
      markerRef.current.setLatLng([lat, lon]);
    }
  }, [lat, lon, interactive]);

  useEffect(() => {
    if (!mapRef.current || lat == null || lon == null) return;
    mapRef.current.setView([lat, lon]);
  }, [lat, lon]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`w-full rounded-2xl overflow-hidden border line ${
        interactive ? "h-56" : "h-32"
      }`}
    />
  );
}
