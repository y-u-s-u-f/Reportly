import { motion } from "framer-motion";
import { Link } from "react-router";
import { MapPin, MessageSquare, ThumbsUp, Users } from "lucide-react";
import { SeverityBadge, DepartmentBadge } from "./Badge.jsx";
import SafeImg from "../SafeImg.jsx";
import { assetUrl } from "../../lib/api.js";
import { timeAgo } from "../../lib/time.js";
import { formatDistance } from "../../lib/geo.js";
import { pressTap, spring } from "../../design/motion.js";

export default function ReportCard({
  report,
  distanceMeters,
  variant = "default",
}) {
  const photo = report.photos?.[0];
  const firstComment = Array.isArray(report.comments) ? report.comments.length : 0;

  const title =
    report.issueType ||
    report.summary?.split(".")[0] ||
    (report.description || "Report").slice(0, 60);

  const bodyText =
    report.summary ||
    (report.description
      ? report.description.slice(0, 120) + (report.description.length > 120 ? "…" : "")
      : null);

  if (variant === "grid") {
    return (
      <motion.div whileTap={pressTap} transition={spring}>
        <Link
          to={`/r/${report.id}`}
          className="block rounded-2xl surface-0 border line overflow-hidden hover:border-[color:var(--color-line-strong)] transition focus-ring"
        >
          <div className="relative aspect-square surface-2">
            {photo ? (
              <SafeImg
                src={assetUrl(photo)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[color:var(--color-primary-200)] via-[color:var(--color-primary-100)] to-[color:var(--color-accent-400)]/20 flex items-center justify-center">
                <MapPin size={28} className="text-[color:var(--color-primary-600)]" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <SeverityBadge level={report.severity} />
            </div>
            {report.photos?.length > 1 && (
              <span className="absolute top-2 right-2 text-[10px] font-medium tabular bg-black/55 text-white rounded-full px-1.5 py-0.5 backdrop-blur">
                +{report.photos.length - 1}
              </span>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-[13px] leading-tight ink line-clamp-2 min-h-[2.2em]">
              {title}
            </h3>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] ink-subtle tabular">
              <span className="flex items-center gap-0.5">
                <ThumbsUp size={11} /> {report.affectedCount || 1}
              </span>
              {distanceMeters != null && (
                <span className="flex items-center gap-0.5">
                  <MapPin size={11} /> {formatDistance(distanceMeters)}
                </span>
              )}
              <span className="ml-auto truncate">{timeAgo(report.createdAt)}</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (variant === "compact") {
    return (
      <motion.div whileTap={pressTap} transition={spring}>
        <Link
          to={`/r/${report.id}`}
          className="flex items-center gap-3 rounded-2xl surface-0 border line p-3 focus-ring"
        >
          <div className="h-14 w-14 rounded-xl overflow-hidden surface-2 flex-shrink-0">
            {photo ? (
              <SafeImg
                src={assetUrl(photo)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[color:var(--color-primary-100)] to-[color:var(--color-primary-200)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <SeverityBadge level={report.severity} />
            </div>
            <div className="font-medium text-[14px] ink line-clamp-1">{title}</div>
            <div className="text-[12px] ink-subtle tabular mt-0.5">
              {timeAgo(report.createdAt)}
              {distanceMeters != null && ` · ${formatDistance(distanceMeters)}`}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div whileTap={pressTap} transition={spring}>
      <Link
        to={`/r/${report.id}`}
        className="block rounded-3xl surface-0 border line overflow-hidden hover:border-[color:var(--color-line-strong)] transition focus-ring"
      >
        <div className="relative h-44 surface-2">
          {photo ? (
            <SafeImg
              src={assetUrl(photo)}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[color:var(--color-primary-200)] via-[color:var(--color-primary-100)] to-[color:var(--color-accent-400)]/20 flex items-center justify-center">
              <MapPin size={36} className="text-[color:var(--color-primary-600)]" />
            </div>
          )}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <SeverityBadge level={report.severity} />
            {report.photos?.length > 1 && (
              <span className="text-[11px] font-medium tabular bg-black/50 text-white rounded-full px-2 py-1 backdrop-blur">
                +{report.photos.length - 1}
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <DepartmentBadge department={report.department} />
          </div>

          <h3 className="font-semibold text-[16px] leading-tight ink line-clamp-2">
            {title}
          </h3>
          {bodyText && (
            <p className="text-[13px] ink-muted mt-1.5 line-clamp-2 leading-relaxed">
              {bodyText}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3 text-[12px] ink-subtle tabular">
            <span className="flex items-center gap-1">
              <ThumbsUp size={13} /> {report.affectedCount || 1}
            </span>
            {firstComment > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare size={13} /> {firstComment}
              </span>
            )}
            {distanceMeters != null && (
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {formatDistance(distanceMeters)}
              </span>
            )}
            <span className="ml-auto">{timeAgo(report.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
