import { useEffect, useMemo, useState } from "react";
import {
  Inbox,
  RefreshCw,
  Users,
  MapPin,
  Pencil,
  Trash2,
  Lock,
  Compass,
} from "lucide-react";
import { assetUrl, deleteReport, fetchReports, updateStatus } from "../lib/api.js";
import { SeverityBadge, DepartmentBadge, SEVERITY_COLOR } from "../components/Badges.jsx";
import StatusSteps from "../components/StatusSteps.jsx";
import EditReportModal from "../components/EditReportModal.jsx";
import PhotoCarousel from "../components/PhotoCarousel.jsx";
import { useToast } from "../components/Toast.jsx";
import { notify, statusLabel } from "../lib/notify.js";
import { timeAgo } from "../lib/time.js";
import { formatDistance, haversineMeters, ipGeolocate, MILE_M } from "../lib/geo.js";

const NEARBY_RADIUS_M = 25 * MILE_M;

export default function DashboardTab({ refreshKey, onChange, admin }) {
  const [reports, setReports] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [coords, setCoords] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchReports()
      .then((data) => setReports(data))
      .catch(() => setReports([]));
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    async function fallbackToIp() {
      const ip = await ipGeolocate();
      if (!cancelled && ip) setCoords({ ...ip, approx: true });
    }
    if (!navigator.geolocation) {
      fallbackToIp();
      return () => {
        cancelled = true;
      };
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          approx: false,
        });
      },
      () => {
        if (!cancelled) fallbackToIp();
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60_000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const nearby = useMemo(() => {
    if (!coords || !reports) return [];
    return reports
      .map((r) => ({ ...r, distance: haversineMeters(coords.lat, coords.lon, r.latitude, r.longitude) }))
      .filter((r) => r.distance <= NEARBY_RADIUS_M)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);
  }, [coords, reports]);

  async function cycleStatus(report) {
    setUpdating(report.id);
    try {
      const updated = await updateStatus(report.id);
      setReports((prev) =>
        prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev,
      );
      notify(
        "Reportly",
        `Your report on ${updated.issueType || "issue"} has been updated to ${statusLabel(updated.status)}`,
      );
      toast.show(`Status → ${statusLabel(updated.status)}`, "success");
      onChange?.();
    } catch (err) {
      toast.show(err.message || "Failed to update status", "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(report) {
    if (!confirm(`Delete this ${report.issueType || "report"}? This cannot be undone.`)) {
      return;
    }
    setDeleting(report.id);
    try {
      await deleteReport(report.id);
      setReports((prev) => (prev ? prev.filter((r) => r.id !== report.id) : prev));
      toast.show("Report deleted", "success");
      onChange?.();
    } catch (err) {
      toast.show(err.message || "Failed to delete", "error");
    } finally {
      setDeleting(null);
    }
  }

  function handleSaved(updated) {
    setReports((prev) =>
      prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev,
    );
    setEditing(null);
    toast.show("Report updated", "success");
    notify(
      "Reportly",
      `Report on ${updated.issueType || "issue"} updated to ${statusLabel(updated.status)}`,
    );
    onChange?.();
  }

  return (
    <div className="px-4 py-5 space-y-5">
      {coords && nearby.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Compass size={14} className="text-teal-500" />
              Nearby — within 25 mi
              {coords.approx && (
                <span className="normal-case text-[10px] font-medium text-zinc-500 tracking-normal">
                  (approx. by IP)
                </span>
              )}
            </h2>
            <span className="text-xs text-zinc-500">{nearby.length}</span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x"
            style={{ scrollbarWidth: "none" }}
          >
            {nearby.map((r) => (
              <NearbyCard key={r.id} report={r} />
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Reports</h1>
        {reports && (
          <span className="rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 px-2.5 py-1 text-xs font-semibold">
            {reports.length}
          </span>
        )}
      </div>

      {reports === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 p-4 space-y-3">
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-3 w-1/3" />
              <div className="skeleton h-20 w-full" />
            </div>
          ))}
        </div>
      )}

      {reports && reports.length === 0 && (
        <div className="text-center py-16 px-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-teal-100 dark:bg-teal-900/40 inline-flex items-center justify-center mb-4">
            <Inbox size={36} className="text-teal-500" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-300 font-medium">
            No reports yet. Be the first to report an issue in your city.
          </p>
        </div>
      )}

      {reports && reports.length > 0 && (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3"
            >
              {r.photos?.length > 1 && (
                <PhotoCarousel photos={r.photos.map(assetUrl)} />
              )}

              <div className="flex gap-3">
                {r.photos?.length === 1 ? (
                  <img
                    src={assetUrl(r.photos[0])}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover shrink-0"
                  />
                ) : r.photos?.length > 1 ? null : (
                  <div className="h-16 w-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 inline-flex items-center justify-center text-zinc-400">
                    <MapPin size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{r.issueType || "Civic issue"}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <DepartmentBadge department={r.department} />
                    <SeverityBadge severity={r.severity} />
                  </div>
                </div>
              </div>

              {r.description && (
                <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-snug line-clamp-3">
                  {r.description}
                </p>
              )}

              <StatusSteps status={r.status} />

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-1 truncate min-w-0">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">
                    {r.address ||
                      `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}
                  </span>
                </div>
                <span className="shrink-0 ml-2">{timeAgo(r.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
                  <Users size={12} />
                  {r.affectedCount} {r.affectedCount === 1 ? "person" : "people"} affected
                </span>
                {admin ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => cycleStatus(r)}
                      disabled={updating === r.id}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-full bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5"
                    >
                      <RefreshCw
                        size={12}
                        className={updating === r.id ? "animate-spin" : ""}
                      />
                      Next status
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(r)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-semibold px-3 py-1.5"
                      aria-label="Edit report"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      disabled={deleting === r.id}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold px-3 py-1.5 disabled:opacity-60"
                      aria-label="Delete report"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                    <Lock size={12} /> Admin sign-in to manage
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditReportModal
          report={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          onError={(msg) => toast.show(msg, "error")}
        />
      )}
    </div>
  );
}

function NearbyCard({ report }) {
  const color = SEVERITY_COLOR[report.severity] || "#6b7280";
  return (
    <div className="snap-start shrink-0 w-60 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold"
          style={{ color }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {report.severity || "unknown"}
        </span>
        <span className="text-[10px] text-zinc-500">
          {formatDistance(report.distance)} away
        </span>
      </div>
      <div className="font-semibold text-sm truncate">
        {report.issueType || "Civic issue"}
      </div>
      {report.description && (
        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 line-clamp-2">
          {report.description}
        </p>
      )}
      <div className="text-[11px] text-zinc-500 mt-1.5 flex items-center justify-between">
        <span className="truncate mr-2">{report.department || ""}</span>
        <span className="shrink-0">{timeAgo(report.createdAt)}</span>
      </div>
    </div>
  );
}
