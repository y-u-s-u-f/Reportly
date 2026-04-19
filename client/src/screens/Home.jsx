import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Search, Sparkles, X } from "lucide-react";
import { fetchReports } from "../lib/api.js";
import { haversineMeters, MILE_M, ipGeolocate } from "../lib/geo.js";
import { useAppStore } from "../store/index.js";
import ReportCard from "../components/ui/ReportCard.jsx";
import { Chip, FilterChipRow } from "../components/ui/Chip.jsx";
import { SkeletonList } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Button from "../components/ui/Button.jsx";
import ViewToggle from "../components/ui/ViewToggle.jsx";
import { pageMotion } from "../design/motion.js";

const DEPARTMENTS = [
  "Roads & Transport",
  "Sanitation",
  "Public Safety",
  "Parks & Recreation",
  "Utilities",
  "Water & Drainage",
  "General Services",
];

const NEAR_M = 5 * MILE_M;
const CITY_M = 25 * MILE_M;

export default function Home() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const [reports, setReports] = useState(null);
  const [coords, setCoords] = useState(null);
  const [dept, setDept] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchReports()
      .then((data) => !cancelled && setReports(data))
      .catch(() => !cancelled && setReports([]));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      ipGeolocate().then((c) => c && setCoords(c));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => ipGeolocate().then((c) => c && setCoords(c)),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  const withDistance = useMemo(() => {
    if (!reports) return null;
    return reports.map((r) => ({
      r,
      d: coords ? haversineMeters(coords.lat, coords.lon, r.latitude, r.longitude) : null,
    }));
  }, [reports, coords]);

  const filtered = useMemo(() => {
    if (!withDistance) return null;
    const ql = q.trim().toLowerCase();
    return withDistance.filter(({ r }) => {
      if (dept !== "all" && r.department !== dept) return false;
      if (!ql) return true;
      return (
        (r.issueType || "").toLowerCase().includes(ql) ||
        (r.description || "").toLowerCase().includes(ql) ||
        (r.summary || "").toLowerCase().includes(ql) ||
        (r.address || "").toLowerCase().includes(ql)
      );
    });
  }, [withDistance, dept, q]);

  const buckets = useMemo(() => groupByDistance(filtered), [filtered]);

  return (
    <motion.div {...pageMotion} className="px-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[28px] leading-tight ink">
          {coords ? "In your area" : "Latest reports"}
        </h2>
        <div className="flex items-center gap-2">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <button
            type="button"
            onClick={() => setSearchOpen((o) => !o)}
            aria-label={searchOpen ? "Close search" : "Open search"}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full surface-2 hover:surface-3 transition"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3"
        >
          <input
            autoFocus
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports…"
            className="w-full h-11 rounded-full border line surface-0 px-4 text-[14px] focus:outline-none focus:border-[color:var(--color-primary-500)]"
          />
        </motion.div>
      )}

      <div className="mt-4 -mx-4 px-4">
        <FilterChipRow>
          <Chip active={dept === "all"} onClick={() => setDept("all")}>
            All
          </Chip>
          {DEPARTMENTS.map((d) => (
            <Chip
              key={d}
              active={dept === d}
              onClick={() => setDept(d === dept ? "all" : d)}
            >
              {shortDept(d)}
            </Chip>
          ))}
        </FilterChipRow>
      </div>

      <div className="mt-5">
        {filtered == null ? (
          <SkeletonList n={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={26} />}
            title="A clean slate."
            subtitle={
              q || dept !== "all"
                ? "No reports match your filters. Try clearing them."
                : "No reports here yet. File the first one to kick things off."
            }
            action={
              <Button
                as={Link}
                to="/report"
                variant="primary"
                size="lg"
              >
                File a report
              </Button>
            }
          />
        ) : (
          <FeedSections buckets={buckets} viewMode={viewMode} />
        )}
      </div>
    </motion.div>
  );
}

function FeedSections({ buckets, viewMode }) {
  return (
    <div className="flex flex-col gap-6">
      <Bucket title="Nearby" items={buckets.near} viewMode={viewMode} />
      <Bucket title="Across the city" items={buckets.city} viewMode={viewMode} />
      <Bucket title="Other" items={buckets.far} viewMode={viewMode} />
    </div>
  );
}

function Bucket({ title, items, viewMode }) {
  if (!items.length) return null;
  const isGrid = viewMode === "grid";
  return (
    <section>
      <h3 className="text-[12px] uppercase tracking-wider ink-subtle font-semibold mb-2.5">
        {title}
      </h3>
      <div
        className={isGrid ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}
      >
        {items.map(({ r, d }) => (
          <ReportCard
            key={r.id}
            report={r}
            distanceMeters={d}
            variant={isGrid ? "grid" : "default"}
          />
        ))}
      </div>
    </section>
  );
}

function groupByDistance(list) {
  const near = [], city = [], far = [];
  if (!list) return { near, city, far };
  for (const item of list) {
    if (item.d == null) far.push(item);
    else if (item.d <= NEAR_M) near.push(item);
    else if (item.d <= CITY_M) city.push(item);
    else far.push(item);
  }
  return near.length > 0
    ? { near, city, far }
    : { near: [], city: [], far: [...near, ...city, ...far] };
}

function shortDept(d) {
  const map = {
    "Roads & Transport": "Roads",
    Sanitation: "Sanitation",
    "Public Safety": "Safety",
    "Parks & Recreation": "Parks",
    Utilities: "Utilities",
    "Water & Drainage": "Water",
    "General Services": "General",
  };
  return map[d] || d;
}
