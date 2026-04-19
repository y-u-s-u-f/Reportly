function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const GRADIENTS = [
  ["#6366f1", "#a855f7"],
  ["#0ea5e9", "#6366f1"],
  ["#14b8a6", "#6366f1"],
  ["#f59e0b", "#ef4444"],
  ["#84cc16", "#22c55e"],
  ["#ec4899", "#8b5cf6"],
  ["#22d3ee", "#6366f1"],
];

export default function Avatar({ seed = "", initials, size = 36, className = "" }) {
  const idx = hashString(seed || "anon") % GRADIENTS.length;
  const [a, b] = GRADIENTS[idx];
  const letters =
    initials ||
    (seed || "A")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 2)
      .toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}
      aria-hidden="true"
    >
      {letters}
    </span>
  );
}
