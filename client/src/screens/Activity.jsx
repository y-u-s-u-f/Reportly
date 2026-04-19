import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Bell, Sparkles } from "lucide-react";
import { fetchReports } from "../lib/api.js";
import { useAppStore } from "../store/index.js";
import { getDeviceId } from "../lib/device.js";
import { timeAgo } from "../lib/time.js";
import SegmentedControl from "../components/ui/SegmentedControl.jsx";
import ReportCard from "../components/ui/ReportCard.jsx";
import ViewToggle from "../components/ui/ViewToggle.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { DepartmentBadge } from "../components/ui/Badge.jsx";
import { SkeletonList } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Button from "../components/ui/Button.jsx";
import { pageMotion } from "../design/motion.js";

export default function Activity() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const [reports, setReports] = useState(null);
  const [segment, setSegment] = useState("updates");
  const [deviceId] = useState(() => getDeviceId());

  useEffect(() => {
    let cancelled = false;
    fetchReports()
      .then((d) => !cancelled && setReports(d))
      .catch(() => !cancelled && setReports([]));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const { mine, updatesList } = useMemo(() => {
    if (!reports) return { mine: null, updatesList: null };
    const mine = reports.filter((r) => r.userId === deviceId);
    const byId = Object.fromEntries(reports.map((r) => [r.id, r]));
    const updates = [];
    for (const r of reports) {
      const isMine = r.userId === deviceId;
      const iUpvoted = (r.upvoterIds || []).includes(deviceId);
      if (!isMine && !iUpvoted) continue;
      for (const u of r.statusUpdates || []) {
        updates.push({
          id: `${r.id}_${u.createdAt}`,
          report: byId[r.id],
          update: u,
          isMine,
        });
      }
    }
    updates.sort((a, b) => new Date(b.update.createdAt) - new Date(a.update.createdAt));
    return { mine, updatesList: updates };
  }, [reports, deviceId]);

  return (
    <motion.div {...pageMotion} className="px-4 pt-4">
      <h1 className="font-display text-[28px] leading-tight ink mb-4">
        Your activity
      </h1>

      <div className="flex items-center justify-between gap-3">
        <SegmentedControl
          value={segment}
          onChange={setSegment}
          options={[
            { value: "updates", label: "Updates" },
            { value: "mine", label: "Your reports" },
          ]}
        />
        {segment === "mine" && (
          <ViewToggle value={viewMode} onChange={setViewMode} />
        )}
      </div>

      <div className="mt-5">
        {segment === "updates" ? (
          <UpdatesFeed list={updatesList} />
        ) : (
          <MyReports list={mine} viewMode={viewMode} />
        )}
      </div>
    </motion.div>
  );
}

function UpdatesFeed({ list }) {
  if (list == null) return <SkeletonList n={3} />;
  if (list.length === 0)
    return (
      <EmptyState
        icon={<Bell size={26} />}
        title="Nothing new yet."
        subtitle="When officials respond to your reports — or reports you've upvoted — updates show up here."
        action={
          <Button as={Link} to="/" variant="secondary" size="md">
            Browse nearby reports
          </Button>
        }
      />
    );

  const groups = groupByDay(list);
  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ dayLabel, items }) => (
        <section key={dayLabel}>
          <h3 className="text-[12px] uppercase tracking-wider ink-subtle font-semibold mb-2.5">
            {dayLabel}
          </h3>
          <div className="flex flex-col gap-2">
            {items.map(({ id, report, update }) => (
              <UpdateRow key={id} report={report} update={update} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function UpdateRow({ report, update }) {
  return (
    <Link
      to={`/r/${report.id}`}
      className="flex gap-3 items-start rounded-2xl surface-0 border line p-3.5 hover:border-[color:var(--color-line-strong)] transition focus-ring"
    >
      <Avatar
        seed={report.department || "City"}
        initials={(report.department || "CT").slice(0, 2).toUpperCase()}
        size={40}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <DepartmentBadge department={report.department} />
          <span className="text-[12px] ink-subtle tabular">
            {timeAgo(update.createdAt)}
          </span>
        </div>
        <p className="text-[14px] ink leading-relaxed line-clamp-3">
          {update.text}
        </p>
        <p className="text-[12px] ink-muted mt-1.5 line-clamp-1">
          Re: {report.issueType || report.summary || "Report"}
        </p>
      </div>
    </Link>
  );
}

function MyReports({ list, viewMode }) {
  if (list == null) return <SkeletonList n={3} />;
  if (list.length === 0)
    return (
      <EmptyState
        icon={<Sparkles size={26} />}
        title="Your reports live here."
        subtitle="File your first report and track it from submission to resolution."
        action={
          <Button as={Link} to="/report" variant="primary" size="lg">
            File a report
          </Button>
        }
      />
    );
  const isGrid = viewMode === "grid";
  return (
    <div className={isGrid ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"}>
      {list.map((r) => (
        <ReportCard
          key={r.id}
          report={r}
          variant={isGrid ? "grid" : "compact"}
        />
      ))}
    </div>
  );
}

function groupByDay(list) {
  const map = new Map();
  for (const item of list) {
    const d = new Date(item.update.createdAt);
    const key = d.toDateString();
    if (!map.has(key)) map.set(key, { dayLabel: niceDay(d), items: [] });
    map.get(key).items.push(item);
  }
  return Array.from(map.values());
}

function niceDay(d) {
  const today = new Date();
  const diffDays = Math.floor((today - d) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
