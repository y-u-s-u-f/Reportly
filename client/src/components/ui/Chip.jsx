import { motion } from "framer-motion";
import { pressTap, spring } from "../../design/motion.js";

export function Chip({
  active = false,
  icon,
  children,
  onClick,
  count,
  size = "md",
  className = "",
}) {
  const sizing =
    size === "sm" ? "h-8 px-3 text-xs gap-1.5" : "h-9 px-3.5 text-sm gap-1.5";
  return (
    <motion.button
      type="button"
      whileTap={pressTap}
      transition={spring}
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center rounded-full font-medium transition border ${sizing} ${
        active
          ? "bg-[color:var(--color-primary-600)] text-white border-[color:var(--color-primary-600)]"
          : "bg-[color:var(--color-surface-0)] text-[color:var(--color-ink-muted)] border-[color:var(--color-line)] hover:border-[color:var(--color-line-strong)] hover:text-[color:var(--color-ink)]"
      } ${className}`}
    >
      {icon}
      <span>{children}</span>
      {count != null && (
        <span
          className={`ml-0.5 tabular rounded-full px-1.5 text-[11px] ${
            active
              ? "bg-white/20 text-white"
              : "bg-[color:var(--color-surface-2)] text-[color:var(--color-ink-muted)]"
          }`}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}

export function FilterChipRow({ children, className = "" }) {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar ${className}`}
    >
      {children}
    </div>
  );
}
