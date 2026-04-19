import { useEffect, useState } from "react";
import {
  MapPin,
  Users,
  MessageSquare,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Share2,
} from "lucide-react";
import Logo from "./Logo.jsx";
import PhotoCarousel from "./PhotoCarousel.jsx";
import { SeverityBadge, DepartmentBadge } from "./Badges.jsx";
import { assetUrl, fetchReport } from "../lib/api.js";
import { timeAgo } from "../lib/time.js";
import { statusLabel } from "../lib/notify.js";
import { shareReport } from "../lib/share.js";

export default function ReportView({ id }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport(id)
      .then(setReport)
      .catch((err) => setError(err.message || "Couldn't load report"));
  }, [id]);

  async function handleShare() {
    if (report) await shareReport(report);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3 gap-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 min-h-[40px]"
            aria-label="Back to Reportly"
          >
            <ArrowLeft size={18} className="text-zinc-500" />
            <Logo className="h-7 w-7" />
            <span className="text-lg font-bold text-teal-500 dark:text-teal-300">
              Reportly
            </span>
          </a>
          {report && (
            <button
              type="button"
              onClick={handleShare}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-3"
            >
              <Share2 size={14} />
              Share
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {!report && !error && (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading report…
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 p-6 text-center">
            <AlertTriangle
              size={28}
              className="mx-auto mb-2 text-amber-600 dark:text-amber-300"
            />
            <p className="font-semibold">{error}</p>
            <a
              href="/"
              className="mt-3 inline-block text-sm font-semibold text-teal-600 dark:text-teal-300 hover:underline"
            >
              Back to Reportly
            </a>
          </div>
        )}

        {report && (
          <article className="space-y-4">
            {report.photos?.length > 0 && (
              <PhotoCarousel photos={report.photos.map(assetUrl)} />
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <DepartmentBadge department={report.department} />
                <SeverityBadge severity={report.severity} />
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold px-2.5 py-1">
                  {statusLabel(report.status)}
                </span>
              </div>
              <h1 className="text-2xl font-bold">
                {report.issueType || "Civic issue"}
              </h1>
              {report.summary && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {report.summary}
                </p>
              )}
            </div>

            {report.description && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">
                  Reporter's description
                </div>
                <p className="text-sm leading-relaxed">{report.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} />
                {report.affectedCount}{" "}
                {report.affectedCount === 1 ? "person" : "people"} affected
              </span>
              <span>{timeAgo(report.createdAt)}</span>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-teal-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {report.address ||
                    `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                </div>
              </div>
            </div>

            {Array.isArray(report.statusUpdates) &&
              report.statusUpdates.length > 0 && (
                <div className="rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-900/20 p-4">
                  <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-wider font-bold text-teal-700 dark:text-teal-200">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-600 recording-pulse" />
                    Live updates
                  </div>
                  <ol className="space-y-2.5">
                    {[...report.statusUpdates]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt) - new Date(a.createdAt),
                      )
                      .map((u, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              i === 0
                                ? "bg-teal-500"
                                : "bg-teal-300 dark:bg-teal-700"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="leading-snug">{u.text}</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {timeAgo(u.createdAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ol>
                </div>
              )}

            {Array.isArray(report.comments) && report.comments.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <div className="flex items-center gap-1.5 mb-3 text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                  <MessageSquare size={12} />
                  {report.comments.length} comment
                  {report.comments.length === 1 ? "" : "s"}
                </div>
                <ul className="space-y-2">
                  {[...report.comments]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt),
                    )
                    .map((c, i) => (
                      <li key={i} className="text-sm">
                        <p className="leading-snug">{c.text}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {timeAgo(c.createdAt)}
                        </p>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="pt-2 pb-10 text-center">
              <a
                href="/"
                className="inline-block text-sm font-semibold text-teal-600 dark:text-teal-300 hover:underline"
              >
                Open Reportly →
              </a>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
