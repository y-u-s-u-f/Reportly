import { motion } from "framer-motion";
import { pressTap, spring } from "../../design/motion.js";

export default function StatTile({
  label,
  value,
  hint,
  accent = false,
  icon,
  onClick,
  className = "",
}) {
  const Tag = onClick ? motion.button : "div";
  const extra = onClick
    ? { whileTap: pressTap, transition: spring, type: "button", onClick }
    : {};
  return (
    <Tag
      {...extra}
      className={`flex-1 text-left rounded-2xl border line p-4 transition ${
        accent
          ? "bg-[color:var(--color-primary-950)] text-white border-transparent"
          : "surface-0 hover:border-[color:var(--color-line-strong)]"
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`text-[12px] font-medium ${accent ? "text-[color:var(--color-primary-200)]" : "ink-muted"}`}
        >
          {label}
        </span>
        {icon && (
          <span
            className={`${accent ? "text-[color:var(--color-accent-300)]" : "text-[color:var(--color-primary-500)]"}`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="font-display tabular mt-1 text-[34px] leading-none">
        {value}
      </div>
      {hint && (
        <div
          className={`mt-1.5 text-[12px] ${accent ? "text-[color:var(--color-primary-200)]" : "ink-subtle"}`}
        >
          {hint}
        </div>
      )}
    </Tag>
  );
}
