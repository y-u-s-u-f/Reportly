import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import { assetUrl, fetchReports } from "../lib/api.js";
import { SEVERITY_COLOR } from "../components/Badges.jsx";
import ReportPopup from "../components/ReportPopup.jsx";

function severityIcon(sev) {
  const color = SEVERITY_COLOR[sev] || "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function MapTab({ refreshKey }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([20, 0], 2);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);
    mapRef.current = map;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 14),
        () => {},
        { timeout: 8000 },
      );
    }
  }, []);

  useEffect(() => {
    fetchReports().then(setReports).catch(() => setReports([]));
  }, [refreshKey]);

  useEffect(() => {
    return () => {
      if (layerRef.current) {
        layerRef.current.eachLayer((m) => {
          if (m._reactRoot) queueMicrotask(() => m._reactRoot.unmount());
        });
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layerRef.current) {
      layerRef.current.eachLayer((m) => {
        if (m._reactRoot) {
          queueMicrotask(() => m._reactRoot.unmount());
        }
      });
      layerRef.current.remove();
      layerRef.current = null;
    }

    const open = reports.filter((r) => r.status !== "resolved");
    if (open.length === 0) return;

    const group = L.layerGroup();
    open.forEach((r) => {
      const marker = L.marker([r.latitude, r.longitude], {
        icon: severityIcon(r.severity),
      });
      const node = document.createElement("div");
      const root = createRoot(node);
      root.render(
        <ReportPopup report={r} photos={(r.photos || []).map(assetUrl)} />,
      );
      marker._reactRoot = root;
      marker.bindPopup(node, { minWidth: 240, maxWidth: 280 });
      marker.addTo(group);
    });
    group.addTo(map);
    layerRef.current = group;
  }, [reports]);

  return (
    <div className="relative h-[calc(100vh-9rem)]">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute bottom-3 left-3 z-[400] rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-3 py-2 shadow-md text-xs">
        <div className="font-semibold mb-1.5">Severity</div>
        <div className="space-y-1">
          <LegendRow color={SEVERITY_COLOR.low} label="Low" />
          <LegendRow color={SEVERITY_COLOR.medium} label="Medium" />
          <LegendRow color={SEVERITY_COLOR.high} label="High" />
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
