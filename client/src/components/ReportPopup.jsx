import PhotoCarousel from "./PhotoCarousel.jsx";
import { SEVERITY_COLOR } from "./Badges.jsx";
import { statusLabel } from "../lib/notify.js";

export default function ReportPopup({ report, photos }) {
  return (
    <div className="min-w-[220px] max-w-[260px]">
      {photos?.length ? <PhotoCarousel photos={photos} className="mb-2" /> : null}
      <div className="font-bold text-sm mb-1">{report.issueType || "Civic issue"}</div>
      {report.department && (
        <div className="text-xs font-semibold mb-1" style={{ color: "#01696f" }}>
          {report.department}
        </div>
      )}
      <div className="text-xs flex items-center gap-2 mb-1">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: SEVERITY_COLOR[report.severity] || "#6b7280" }}
        />
        <span className="capitalize">{report.severity || "unknown"}</span>
        <span className="text-zinc-500">· {statusLabel(report.status)}</span>
      </div>
      <div className="text-xs text-zinc-500">
        {report.affectedCount} {report.affectedCount === 1 ? "person" : "people"} affected
      </div>
    </div>
  );
}
