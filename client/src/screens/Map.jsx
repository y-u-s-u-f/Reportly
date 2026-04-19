import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { LocateFixed, Layers, Search, X, ChevronRight } from "lucide-react";
import { fetchReports, assetUrl } from "../lib/api.js";
import { useAppStore } from "../store/index.js";
import { SEVERITY_COLOR, SeverityBadge, DepartmentBadge } from "../components/ui/Badge.jsx";
import BottomSheet, { SheetBody } from "../components/ui/BottomSheet.jsx";
import { Chip, FilterChipRow } from "../components/ui/Chip.jsx";
import SafeImg from "../components/SafeImg.jsx";
import Button from "../components/ui/Button.jsx";
import { pressTap, spring } from "../design/motion.js";

function markerIcon(sev) {
  const color = SEVERITY_COLOR[sev] || "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

let heatScriptLoaded = null;
function loadHeatScript() {
  if (heatScriptLoaded) return heatScriptLoaded;
  heatScriptLoaded = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/leaflet.heat@0.2.0/dist/leaflet-heat.js";
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
  return heatScriptLoaded;
}

export default function MapScreen() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const heatRef = useRef(null);
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sev, setSev] = useState("all");
  const [heat, setHeat] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false }).setView(
      [20, 0],
      2,
    );
    L.control.zoom({ position: "topright" }).addTo(map);
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
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    fetchReports().then(setReports).catch(() => setReports([]));
  }, [refreshKey]);

  const filtered = useMemo(
    () =>
      reports.filter((r) => {
        if (r.resolvedAt) return false;
        if (sev !== "all" && r.severity !== sev) return false;
        if (query) {
          const q = query.toLowerCase();
          return (
            (r.issueType || "").toLowerCase().includes(q) ||
            (r.description || "").toLowerCase().includes(q) ||
            (r.address || "").toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [reports, sev, query],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 55,
    });
    filtered.forEach((r) => {
      const marker = L.marker([r.latitude, r.longitude], {
        icon: markerIcon(r.severity),
      });
      marker.on("click", () => setSelected(r));
      cluster.addLayer(marker);
    });
    cluster.addTo(map);
    clusterRef.current = cluster;
  }, [filtered]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    async function handleHeat() {
      if (heat) {
        await loadHeatScript();
        if (cancelled || !L.heatLayer) return;
        if (heatRef.current) map.removeLayer(heatRef.current);
        const layer = L.heatLayer(
          filtered.map((r) => [r.latitude, r.longitude, 0.6]),
          { radius: 30, blur: 22 },
        );
        layer.addTo(map);
        heatRef.current = layer;
      } else if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    }
    handleHeat();
    return () => {
      cancelled = true;
    };
  }, [heat, filtered]);

  function locateMe() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        mapRef.current.setView(
          [pos.coords.latitude, pos.coords.longitude],
          15,
          { animate: true },
        ),
      () => {},
      { timeout: 6000 },
    );
  }

  return (
    <div className="relative h-[calc(100dvh-56px-68px-env(safe-area-inset-bottom))]">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute top-3 left-3 right-3 z-[400] flex items-start gap-2">
        <div className="flex-1 flex items-center gap-2 surface-0 rounded-full border line shadow-[var(--elev-2)] pl-4 pr-2 h-11">
          <Search size={16} className="ink-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address or keyword"
            className="flex-1 bg-transparent text-sm focus:outline-none ink"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:surface-2"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="absolute top-[68px] left-3 right-3 z-[400]">
        <FilterChipRow>
          <Chip size="sm" active={sev === "all"} onClick={() => setSev("all")}>All</Chip>
          <Chip size="sm" active={sev === "high"} onClick={() => setSev("high")}>
            <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: SEVERITY_COLOR.high }} />
            High
          </Chip>
          <Chip size="sm" active={sev === "medium"} onClick={() => setSev("medium")}>
            <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: SEVERITY_COLOR.medium }} />
            Medium
          </Chip>
          <Chip size="sm" active={sev === "low"} onClick={() => setSev("low")}>
            <span className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: SEVERITY_COLOR.low }} />
            Low
          </Chip>
        </FilterChipRow>
      </div>

      <div className="absolute right-3 bottom-3 z-[400] flex flex-col gap-2">
        <motion.button
          whileTap={pressTap}
          transition={spring}
          type="button"
          onClick={() => setHeat((h) => !h)}
          aria-pressed={heat}
          aria-label="Toggle heatmap"
          className={`h-11 w-11 inline-flex items-center justify-center rounded-full shadow-[var(--elev-2)] ${heat ? "bg-[color:var(--color-primary-600)] text-white" : "surface-0 border line ink"}`}
        >
          <Layers size={18} />
        </motion.button>
        <motion.button
          whileTap={pressTap}
          transition={spring}
          type="button"
          onClick={locateMe}
          aria-label="Locate me"
          className="h-11 w-11 inline-flex items-center justify-center rounded-full surface-0 border line shadow-[var(--elev-2)] ink"
        >
          <LocateFixed size={18} />
        </motion.button>
      </div>

      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        size="sm"
        showHandle
      >
        {selected && <SelectedPreview report={selected} onClose={() => setSelected(null)} />}
      </BottomSheet>
    </div>
  );
}

function SelectedPreview({ report, onClose }) {
  const photo = report.photos?.[0];
  return (
    <SheetBody className="pt-2">
      <div className="flex gap-3">
        <div className="h-20 w-20 rounded-2xl overflow-hidden surface-2 flex-shrink-0">
          {photo ? (
            <SafeImg
              src={assetUrl(photo)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[color:var(--color-primary-200)] to-[color:var(--color-primary-100)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <SeverityBadge level={report.severity} />
            <DepartmentBadge department={report.department} />
          </div>
          <h3 className="font-semibold leading-tight ink line-clamp-2">
            {report.issueType || report.summary || "Report"}
          </h3>
          {report.address && (
            <p className="text-[12px] ink-subtle mt-1 line-clamp-1">
              {report.address}
            </p>
          )}
        </div>
      </div>
      <Button
        as={Link}
        to={`/r/${report.id}`}
        onClick={onClose}
        variant="primary"
        size="md"
        fullWidth
        className="mt-4"
        iconTrailing={<ChevronRight size={18} />}
      >
        View report
      </Button>
    </SheetBody>
  );
}
