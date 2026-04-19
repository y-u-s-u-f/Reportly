import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  MapPin,
  Send,
  Loader2,
  Pencil,
  Trash2,
  Megaphone,
  Camera,
  Mail,
  CheckCircle2,
} from "lucide-react";
import {
  addComment,
  addPhotosToReport,
  assetUrl,
  deleteReport,
  draftAuthorityEmail,
  fetchReport,
  postStatusUpdate,
  updateReport,
  upvoteReport,
} from "../lib/api.js";
import { useAppStore } from "../store/index.js";
import { getDeviceId } from "../lib/device.js";
import { timeAgo } from "../lib/time.js";
import { shareReport } from "../lib/share.js";
import { SeverityBadge, DepartmentBadge } from "../components/ui/Badge.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Button, { IconButton } from "../components/ui/Button.jsx";
import BottomSheet, { SheetBody, SheetFooter } from "../components/ui/BottomSheet.jsx";
import PhotoCarousel from "../components/PhotoCarousel.jsx";
import SafeImg from "../components/SafeImg.jsx";
import { SkeletonLine } from "../components/ui/Skeleton.jsx";
import { pageMotion, pressTap, spring } from "../design/motion.js";

export default function ReportDetail() {
  const { id } = useParams();
  const deviceId = getDeviceId();
  const pushToast = useAppStore((s) => s.pushToast);
  const admin = useAppStore((s) => s.admin);
  const refresh = useAppStore((s) => s.refresh);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [upvoting, setUpvoting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [editing, setEditing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReport(id)
      .then((r) => !cancelled && setReport(r))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const iAlreadyUpvoted = useMemo(
    () => !!report && (report.upvoterIds || []).includes(deviceId),
    [report, deviceId],
  );

  async function handleUpvote() {
    if (!report || iAlreadyUpvoted) return;
    setUpvoting(true);
    try {
      const updated = await upvoteReport(report.id);
      setReport(updated);
      refresh();
      pushToast("Thanks — upvote counted", "success");
    } catch (e) {
      pushToast(e.message || "Upvote failed", "error");
    } finally {
      setUpvoting(false);
    }
  }

  async function handleShare() {
    const res = await shareReport(report);
    if (res.copied) pushToast("Link copied to clipboard", "success");
  }

  async function handleAddPhotos(files) {
    if (!files?.length) return;
    setPhotoUploading(true);
    try {
      const updated = await addPhotosToReport(report.id, Array.from(files));
      setReport(updated);
      refresh();
      pushToast("Photos added", "success");
    } catch (e) {
      pushToast(e.message || "Upload failed", "error");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleEmail() {
    try {
      const { to, subject, body } = await draftAuthorityEmail(report.id);
      if (!to) {
        pushToast("No authority email on file", "error");
        return;
      }
      const href =
        "mailto:" +
        encodeURIComponent(to) +
        "?subject=" +
        encodeURIComponent(subject || "") +
        "&body=" +
        encodeURIComponent(body || "");
      window.location.href = href;
    } catch (e) {
      pushToast(e.message || "Email failed", "error");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    try {
      await deleteReport(report.id);
      refresh();
      history.back();
    } catch (e) {
      pushToast(e.message || "Delete failed", "error");
    }
  }

  if (loading) return <DetailSkeleton />;
  if (error || !report)
    return (
      <div className="px-5 py-16 text-center">
        <p className="ink-muted">{error || "Report not found."}</p>
      </div>
    );

  const photos = (report.photos || []).map(assetUrl);

  return (
    <>
      <motion.div {...pageMotion} className="pb-28">
        <div className="relative aspect-[4/3] sm:aspect-[16/9] surface-2">
          {photos.length > 0 ? (
            <PhotoCarousel photos={photos} className="h-full rounded-none" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[color:var(--color-primary-200)] via-[color:var(--color-primary-100)] to-[color:var(--color-accent-400)]/30 flex items-center justify-center">
              <MapPin size={40} className="text-[color:var(--color-primary-700)]" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <SeverityBadge level={report.severity} size="lg" />
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <DepartmentBadge department={report.department} size="sm" />
            {report.resolvedAt && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-[color:var(--color-accent-400)]/20 text-[color:var(--color-accent-600)]">
                <CheckCircle2 size={12} />
                Resolved {timeAgo(report.resolvedAt)}
              </span>
            )}
            <span className="text-[12px] ink-subtle tabular ml-auto">
              {timeAgo(report.createdAt)}
            </span>
          </div>

          <h1 className="font-display text-[30px] leading-tight ink">
            {report.issueType || report.summary || "Report"}
          </h1>

          {report.summary && report.issueType && (
            <p className="mt-2 text-[14px] ink-muted leading-relaxed">
              {report.summary}
            </p>
          )}

          <p className="mt-3 text-[15px] ink leading-relaxed whitespace-pre-wrap">
            {report.description}
          </p>

          {report.address && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl surface-2 p-3 text-[13px] ink-muted">
              <MapPin size={15} className="flex-shrink-0" />
              <span className="line-clamp-2">{report.address}</span>
            </div>
          )}
        </div>

        <div className="px-5 pt-6">
          <div className="flex items-center gap-3">
            <StatBit
              label="Affected"
              value={report.affectedCount || 1}
              icon={<ThumbsUp size={14} />}
            />
            <StatBit
              label="Comments"
              value={Array.isArray(report.comments) ? report.comments.length : 0}
              icon={<MessageSquare size={14} />}
            />
            <StatBit
              label="Updates"
              value={Array.isArray(report.statusUpdates) ? report.statusUpdates.length : 0}
              icon={<Megaphone size={14} />}
            />
          </div>
        </div>

        {Array.isArray(report.statusUpdates) && report.statusUpdates.length > 0 && (
          <section className="px-5 pt-6">
            <h2 className="text-[13px] uppercase tracking-wider ink-subtle font-semibold mb-3">
              Updates from officials
            </h2>
            <div className="flex flex-col gap-2">
              {[...report.statusUpdates]
                .reverse()
                .map((u, i) => (
                  <div
                    key={i}
                    className="rounded-2xl surface-0 border line p-4"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar
                        seed={report.department || "City"}
                        initials={(report.department || "CT").slice(0, 2).toUpperCase()}
                        size={28}
                      />
                      <DepartmentBadge department={report.department} />
                      <span className="ml-auto text-[12px] ink-subtle tabular">
                        {timeAgo(u.createdAt)}
                      </span>
                    </div>
                    <p className="text-[14px] ink leading-relaxed">{u.text}</p>
                  </div>
                ))}
            </div>
          </section>
        )}

        <section className="px-5 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] uppercase tracking-wider ink-subtle font-semibold">
              Comments ({Array.isArray(report.comments) ? report.comments.length : 0})
            </h2>
            <Button
              size="sm"
              variant="secondary"
              icon={<MessageSquare size={14} />}
              onClick={() => setCommenting(true)}
            >
              Add
            </Button>
          </div>
          {Array.isArray(report.comments) && report.comments.length > 0 ? (
            <div className="flex flex-col gap-2">
              {[...report.comments]
                .reverse()
                .map((c, i) => (
                  <div key={i} className="rounded-2xl surface-0 border line p-3.5">
                    <div className="text-[12px] ink-subtle tabular mb-1">
                      {timeAgo(c.createdAt)}
                    </div>
                    <p className="text-[14px] ink leading-relaxed">{c.text}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-[13px] ink-subtle">
              No comments yet. Share context or confirm you're affected.
            </p>
          )}
        </section>

        <section className="px-5 pt-6">
          <div className="flex items-center gap-2">
            <Button
              size="md"
              variant="secondary"
              icon={<Camera size={16} />}
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUploading}
            >
              Add photos
            </Button>
            <Button
              size="md"
              variant="secondary"
              icon={<Mail size={16} />}
              onClick={handleEmail}
            >
              Email authority
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleAddPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        {admin && (
          <section className="px-5 pt-6">
            <h2 className="text-[13px] uppercase tracking-wider ink-subtle font-semibold mb-3">
              Admin
            </h2>
            <div className="rounded-3xl surface-0 border line p-4 flex gap-2 flex-wrap">
              <Button
                size="md"
                variant="primary"
                icon={<Megaphone size={16} />}
                onClick={() => setPostingUpdate(true)}
              >
                Post update
              </Button>
              <Button
                size="md"
                variant="secondary"
                icon={<Pencil size={16} />}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
              <Button
                size="md"
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </section>
        )}
      </motion.div>

      <StickyActions
        report={report}
        iAlreadyUpvoted={iAlreadyUpvoted}
        upvoting={upvoting}
        onUpvote={handleUpvote}
        onComment={() => setCommenting(true)}
        onShare={handleShare}
      />

      <CommentSheet
        open={commenting}
        onClose={() => setCommenting(false)}
        onSubmit={async (text) => {
          try {
            const updated = await addComment(report.id, text);
            setReport(updated);
            refresh();
            pushToast("Comment posted", "success");
            setCommenting(false);
          } catch (e) {
            pushToast(e.message || "Failed", "error");
          }
        }}
      />

      <StatusUpdateSheet
        open={postingUpdate}
        resolved={!!report.resolvedAt}
        onClose={() => setPostingUpdate(false)}
        onSubmit={async ({ text, resolve }) => {
          try {
            const updated = await postStatusUpdate(report.id, text, { resolve });
            setReport(updated);
            refresh();
            const msg =
              resolve === true
                ? "Marked resolved"
                : resolve === false
                  ? "Re-opened"
                  : "Update posted";
            pushToast(msg, "success");
            setPostingUpdate(false);
          } catch (e) {
            pushToast(e.message || "Failed", "error");
          }
        }}
      />

      <EditSheet
        open={editing}
        report={report}
        onClose={() => setEditing(false)}
        onSubmit={async (fields) => {
          try {
            const updated = await updateReport(report.id, fields);
            setReport(updated);
            refresh();
            pushToast("Report updated", "success");
            setEditing(false);
          } catch (e) {
            pushToast(e.message || "Failed", "error");
          }
        }}
      />
    </>
  );
}

function StatBit({ label, value, icon }) {
  return (
    <div className="flex-1 rounded-2xl surface-0 border line p-3">
      <div className="flex items-center gap-1.5 text-[12px] ink-subtle">
        {icon} {label}
      </div>
      <div className="font-display text-[24px] leading-none tabular mt-1 ink">
        {value}
      </div>
    </div>
  );
}

function StickyActions({ report, iAlreadyUpvoted, upvoting, onUpvote, onComment, onShare }) {
  return (
    <div className="fixed bottom-[calc(68px+env(safe-area-inset-bottom))] inset-x-0 z-[1002] pointer-events-none">
      <div className="mx-auto max-w-2xl px-4 pb-2 pointer-events-auto">
        <div className="rounded-full surface-0 border line shadow-[var(--elev-3)] flex items-center gap-1 p-1.5">
          <motion.button
            whileTap={pressTap}
            transition={spring}
            type="button"
            onClick={onUpvote}
            disabled={iAlreadyUpvoted || upvoting}
            aria-label="Upvote"
            className={`flex-1 h-11 rounded-full inline-flex items-center justify-center gap-1.5 text-sm font-medium transition ${
              iAlreadyUpvoted
                ? "bg-[color:var(--color-primary-50)] text-[color:var(--color-primary-700)]"
                : "hover:surface-2 ink"
            }`}
          >
            {upvoting ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
            {iAlreadyUpvoted ? "Upvoted" : "Upvote"}
            <span className="tabular text-[12px] ink-subtle">
              {report.affectedCount || 1}
            </span>
          </motion.button>
          <div className="w-px h-7 bg-[color:var(--color-line)]" />
          <motion.button
            whileTap={pressTap}
            transition={spring}
            type="button"
            onClick={onComment}
            className="flex-1 h-11 rounded-full inline-flex items-center justify-center gap-1.5 text-sm font-medium hover:surface-2 transition ink"
          >
            <MessageSquare size={16} />
            Comment
          </motion.button>
          <div className="w-px h-7 bg-[color:var(--color-line)]" />
          <motion.button
            whileTap={pressTap}
            transition={spring}
            type="button"
            onClick={onShare}
            className="flex-1 h-11 rounded-full inline-flex items-center justify-center gap-1.5 text-sm font-medium hover:surface-2 transition ink"
          >
            <Share2 size={16} />
            Share
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function CommentSheet({ open, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Add a comment" size="sm">
      <SheetBody>
        <textarea
          autoFocus
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share helpful context — when you noticed, how bad it is, safety concerns."
          className="w-full rounded-2xl border line bg-[color:var(--color-surface-1)] p-3 text-[15px] leading-relaxed focus:outline-none focus:border-[color:var(--color-primary-500)]"
        />
      </SheetBody>
      <SheetFooter>
        <Button
          fullWidth
          size="lg"
          disabled={busy || text.trim().length < 2}
          onClick={async () => {
            setBusy(true);
            await onSubmit(text.trim());
            setBusy(false);
          }}
          icon={busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        >
          Post comment
        </Button>
      </SheetFooter>
    </BottomSheet>
  );
}

function StatusUpdateSheet({ open, resolved, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [resolve, setResolve] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) {
      setText("");
      setResolve(false);
    }
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Post status update" size="sm">
      <SheetBody>
        <textarea
          autoFocus
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="E.g., A crew has been dispatched and will arrive within 48 hours."
          className="w-full rounded-2xl border line bg-[color:var(--color-surface-1)] p-3 text-[15px] leading-relaxed focus:outline-none focus:border-[color:var(--color-primary-500)]"
        />
        <label className="flex items-center gap-3 mt-4 p-3 rounded-2xl surface-2 cursor-pointer">
          <input
            type="checkbox"
            checked={resolve}
            onChange={(e) => setResolve(e.target.checked)}
            className="h-5 w-5 accent-[color:var(--color-accent-500)]"
          />
          <span className="text-[14px] ink flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-[color:var(--color-accent-500)]" />
            {resolved ? "Re-open this report" : "Mark this report as resolved"}
          </span>
        </label>
      </SheetBody>
      <SheetFooter>
        <Button
          fullWidth
          size="lg"
          disabled={busy || text.trim().length < 3}
          onClick={async () => {
            setBusy(true);
            const payload = { text: text.trim() };
            if (resolve) payload.resolve = resolved ? false : true;
            await onSubmit(payload);
            setBusy(false);
          }}
          icon={busy ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
        >
          Post update
        </Button>
      </SheetFooter>
    </BottomSheet>
  );
}

const SEVERITY_OPTIONS = ["low", "medium", "high"];
const DEPT_OPTIONS = [
  "Roads & Transport",
  "Sanitation",
  "Parks & Recreation",
  "Utilities",
  "Public Safety",
  "Water & Drainage",
  "General Services",
];

function EditSheet({ open, report, onClose, onSubmit }) {
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!report) return;
    setFields({
      issueType: report.issueType || "",
      department: report.department || "",
      severity: report.severity || "low",
      description: report.description || "",
    });
  }, [report, open]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit report" size="lg">
      <SheetBody className="space-y-4">
        <Field label="Issue type">
          <input
            value={fields.issueType || ""}
            onChange={(e) => setFields({ ...fields, issueType: e.target.value })}
            className="w-full rounded-xl border line bg-[color:var(--color-surface-1)] px-4 h-11 text-[15px] focus:outline-none focus:border-[color:var(--color-primary-500)]"
          />
        </Field>
        <Field label="Department">
          <select
            value={fields.department || ""}
            onChange={(e) => setFields({ ...fields, department: e.target.value })}
            className="w-full rounded-xl border line bg-[color:var(--color-surface-1)] px-4 h-11 text-[15px] focus:outline-none focus:border-[color:var(--color-primary-500)]"
          >
            <option value="">— None —</option>
            {DEPT_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Severity">
          <div className="flex gap-2">
            {SEVERITY_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFields({ ...fields, severity: s })}
                className={`flex-1 h-11 rounded-xl text-sm font-medium capitalize border transition ${
                  fields.severity === s
                    ? "bg-[color:var(--color-primary-600)] text-white border-[color:var(--color-primary-600)]"
                    : "surface-0 border-[color:var(--color-line)] ink hover:surface-2"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Description">
          <textarea
            rows={4}
            value={fields.description || ""}
            onChange={(e) => setFields({ ...fields, description: e.target.value })}
            className="w-full rounded-xl border line bg-[color:var(--color-surface-1)] p-3 text-[15px] leading-relaxed focus:outline-none focus:border-[color:var(--color-primary-500)]"
          />
        </Field>
      </SheetBody>
      <SheetFooter>
        <Button
          fullWidth
          size="lg"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onSubmit(fields);
            setBusy(false);
          }}
          icon={busy ? <Loader2 size={16} className="animate-spin" /> : null}
        >
          Save changes
        </Button>
      </SheetFooter>
    </BottomSheet>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium ink-muted mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailSkeleton() {
  return (
    <div className="pb-24">
      <div className="aspect-[4/3] skeleton rounded-none" />
      <div className="px-5 pt-5 space-y-3">
        <SkeletonLine w="40%" h={12} />
        <SkeletonLine w="80%" h={28} />
        <SkeletonLine w="100%" h={14} />
        <SkeletonLine w="90%" h={14} />
        <SkeletonLine w="60%" h={14} />
      </div>
    </div>
  );
}
