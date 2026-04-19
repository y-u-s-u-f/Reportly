const SEV = {
  low: {
    label: "Low",
    fg: "text-[color:var(--color-sev-low)]",
    bg: "bg-[color:var(--color-sev-low-soft)]",
    dot: "bg-[color:var(--color-sev-low)]",
    shape: "dot",
  },
  medium: {
    label: "Medium",
    fg: "text-[color:var(--color-sev-med)]",
    bg: "bg-[color:var(--color-sev-med-soft)]",
    dot: "bg-[color:var(--color-sev-med)]",
    shape: "stripe",
  },
  high: {
    label: "High",
    fg: "text-[color:var(--color-sev-high)]",
    bg: "bg-[color:var(--color-sev-high-soft)]",
    dot: "bg-[color:var(--color-sev-high)]",
    shape: "double",
  },
};

export function SeverityBadge({ level, size = "sm" }) {
  const s = SEV[String(level || "").toLowerCase()] || SEV.low;
  const sizing =
    size === "lg"
      ? "text-sm px-3 py-1.5 gap-2"
      : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizing} ${s.bg} ${s.fg}`}
    >
      <Shape type={s.shape} className={s.dot} />
      {s.label}
    </span>
  );
}

function Shape({ type, className }) {
  if (type === "dot")
    return <span className={`h-1.5 w-1.5 rounded-full ${className}`} />;
  if (type === "stripe")
    return <span className={`h-2 w-1 rounded-sm ${className}`} />;
  return (
    <span className="inline-flex gap-0.5 items-center">
      <span className={`h-2 w-0.5 rounded-sm ${className}`} />
      <span className={`h-2 w-0.5 rounded-sm ${className}`} />
    </span>
  );
}

export function DepartmentBadge({ department, size = "sm" }) {
  if (!department) return null;
  const sizing =
    size === "lg" ? "text-sm px-3 py-1.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium bg-[color:var(--color-primary-50)] text-[color:var(--color-primary-700)] ${sizing}`}
    >
      {department}
    </span>
  );
}

export const SEVERITY_COLOR = {
  low: "#059669",
  medium: "#f59e0b",
  high: "#e11d48",
};
