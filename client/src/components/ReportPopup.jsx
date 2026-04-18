import { useState } from "react";
import { Loader2, MessageSquare, ThumbsUp } from "lucide-react";
import PhotoCarousel from "./PhotoCarousel.jsx";
import { SEVERITY_COLOR } from "./Badges.jsx";
import { statusLabel } from "../lib/notify.js";
import { timeAgo } from "../lib/time.js";
import { upvoteReport } from "../lib/api.js";

export default function ReportPopup({ report: initial, photos }) {
  const [report, setReport] = useState(initial);
  const [busy, setBusy] = useState(false);
  const commentCount = Array.isArray(report.comments) ? report.comments.length : 0;

  async function handleUpvote() {
    setBusy(true);
    try {
      const updated = await upvoteReport(report.id);
      setReport(updated);
    } catch {
      /* ignore — the map list will re-fetch on next open */
    } finally {
      setBusy(false);
    }
  }

  const comments = Array.isArray(report.comments) ? report.comments : [];

  return (
    <div className="min-w-[220px] max-w-[260px]" style={{ color: "#0c1414" }}>
      {photos?.length ? <PhotoCarousel photos={photos} className="mb-2" /> : null}
      <div className="font-bold text-sm mb-1" style={{ color: "#0c1414" }}>
        {report.issueType || "Civic issue"}
      </div>
      {report.department && (
        <div className="text-xs font-semibold mb-1" style={{ color: "#01696f" }}>
          {report.department}
        </div>
      )}
      {report.description && (
        <p
          className="text-xs mb-1.5 leading-snug line-clamp-3"
          style={{ color: "#0c1414" }}
        >
          {report.description}
        </p>
      )}
      <div className="text-xs flex items-center gap-2 mb-1" style={{ color: "#0c1414" }}>
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: SEVERITY_COLOR[report.severity] || "#6b7280" }}
        />
        <span className="capitalize">{report.severity || "unknown"}</span>
        <span style={{ color: "#6b7280" }}>· {statusLabel(report.status)}</span>
      </div>
      <div
        className="text-xs mb-2 flex items-center gap-3"
        style={{ color: "#52525b" }}
      >
        <span>
          {report.affectedCount} {report.affectedCount === 1 ? "person" : "people"} affected
        </span>
        {commentCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={10} /> {commentCount}
          </span>
        )}
      </div>

      {comments.length > 0 && (
        <div
          className="mb-2 rounded-lg p-2 space-y-1.5 max-h-32 overflow-y-auto"
          style={{ background: "#f4f4f5" }}
        >
          {[...comments]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map((c, i) => (
              <div key={`${c.createdAt}-${i}`} className="text-xs leading-snug">
                <span style={{ color: "#0c1414" }}>{c.text}</span>
                <span className="ml-1.5" style={{ color: "#71717a" }}>
                  {timeAgo(c.createdAt)}
                </span>
              </div>
            ))}
          {comments.length > 5 && (
            <div className="text-[10px]" style={{ color: "#71717a" }}>
              +{comments.length - 5} more on the dashboard
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleUpvote}
        disabled={busy}
        className="w-full min-h-[36px] inline-flex items-center justify-center gap-1.5 rounded-full bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5"
      >
        {busy ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <ThumbsUp size={12} />
        )}
        I'm affected too
      </button>
    </div>
  );
}
