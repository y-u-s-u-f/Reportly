import { useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { updateReport } from "../lib/api.js";

const STATUSES = ["received", "assigned", "in_progress", "resolved"];
const SEVERITIES = ["low", "medium", "high"];
const DEPARTMENTS = [
  "Roads & Transport",
  "Sanitation",
  "Parks & Recreation",
  "Utilities",
  "Public Safety",
  "Water & Drainage",
  "General Services",
];

export default function EditReportModal({ report, onClose, onSaved, onError }) {
  const [status, setStatus] = useState(report.status);
  const [severity, setSeverity] = useState(report.severity || "medium");
  const [department, setDepartment] = useState(report.department || "General Services");
  const [issueType, setIssueType] = useState(report.issueType || "");
  const [summary, setSummary] = useState(report.summary || "");
  const [busy, setBusy] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await updateReport(report.id, {
        status,
        severity,
        department,
        issueType,
        summary,
      });
      onSaved?.(updated);
    } catch (err) {
      onError?.(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSave}
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Edit report</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={16} />
          </button>
        </div>

        <Field label="Issue type">
          <input
            type="text"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </Field>

        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Severity">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Department">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Summary">
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[48px] rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold inline-flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save changes
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
