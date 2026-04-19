import { motion } from "framer-motion";
import { List, LayoutGrid } from "lucide-react";
import { spring } from "../../design/motion.js";

const OPTIONS = [
  { value: "list", icon: List, label: "List view" },
  { value: "grid", icon: LayoutGrid, label: "Grid view" },
];

export default function ViewToggle({ value, onChange }) {
  return (
    <div
      className="inline-flex p-0.5 rounded-full surface-2 relative"
      role="radiogroup"
      aria-label="View mode"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            onClick={() => onChange(opt.value)}
            className="relative h-8 w-9 inline-flex items-center justify-center rounded-full"
          >
            {active && (
              <motion.span
                layoutId="view-toggle-active"
                transition={spring}
                className="absolute inset-0 bg-[color:var(--color-surface-0)] rounded-full shadow-[var(--elev-1)]"
              />
            )}
            <Icon
              size={15}
              className={`relative ${active ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-ink-muted)]"}`}
              strokeWidth={active ? 2.25 : 1.75}
            />
          </button>
        );
      })}
    </div>
  );
}
