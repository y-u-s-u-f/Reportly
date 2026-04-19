import { motion } from "framer-motion";
import { spring } from "../../design/motion.js";

export default function SegmentedControl({ options, value, onChange, className = "" }) {
  return (
    <div
      className={`relative inline-flex p-1 rounded-full bg-[color:var(--color-surface-2)] ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className="relative px-4 h-9 text-sm font-medium rounded-full transition-colors"
          >
            {active && (
              <motion.span
                layoutId="seg-active"
                transition={spring}
                className="absolute inset-0 bg-[color:var(--color-surface-0)] rounded-full shadow-[var(--elev-1)]"
              />
            )}
            <span
              className={`relative ${active ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-ink-muted)]"}`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
