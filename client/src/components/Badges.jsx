export function SeverityBadge({ severity }) {
  const map = {
    low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  const label = severity ? severity[0].toUpperCase() + severity.slice(1) : "Unknown";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        map[severity] || "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {label}
    </span>
  );
}

export function DepartmentBadge({ department }) {
  if (!department) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 px-2.5 py-1 text-xs font-semibold">
      {department}
    </span>
  );
}

export const SEVERITY_COLOR = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};
