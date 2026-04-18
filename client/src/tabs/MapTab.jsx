import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import { Flame, MapPin } from "lucide-react";
import { assetUrl, fetchReports } from "../lib/api.js";
import { SEVERITY_COLOR } from "../components/Badges.jsx";
import ReportPopup from "../components/ReportPopup.jsx";

let heatPluginPromise = null;
function loadHeatPlugin() {
  if (window.L && window.L.heatLayer) return Promise.resolve();
  if (heatPluginPromise) return heatPluginPromise;
  heatPluginPromise = new Promise((resolve, reject) => {
    window.L = L;
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load heatmap plugin"));
    document.head.appendChild(script);
  });
  return heatPluginPromise;
}

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
  const heatRef = useRef(null);
  const [reports, setReports] = useState([]);
  const [heat, setHeat] = useState(false);

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
    if (heatRef.current) {
      heatRef.current.remove();
      heatRef.current = null;
    }

    const open = reports.filter((r) => r.status !== "resolved");
    if (open.length === 0) return;

    if (heat) {
      loadHeatPlugin().then(() => {
        if (!mapRef.current) return;
        const points = open.map((r) => {
          const intensity = r.severity === "high" ? 1 : r.severity === "medium" ? 0.6 : 0.3;
          return [r.latitude, r.longitude, intensity];
        });
        heatRef.current = window.L.heatLayer(points, {
          radius: 28,
          blur: 22,
          maxZoom: 17,
          gradient: { 0.3: "#10b981", 0.6: "#f59e0b", 0.9: "#ef4444" },
        }).addTo(map);
      });
    } else {
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
    }
  }, [reports, heat]);

  return (
    <div className="relative h-[calc(100vh-9rem)]">
      <div ref={containerRef} className="absolute inset-0" />
      <button
        type="button"
        onClick={() => setHeat((h) => !h)}
        className={`absolute top-3 right-3 z-[400] min-h-[44px] inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition ${
          heat
            ? "bg-teal-500 text-white"
            : "bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        }`}
      >
        {heat ? <Flame size={16} /> : <MapPin size={16} />}
        Heatmap
      </button>
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

