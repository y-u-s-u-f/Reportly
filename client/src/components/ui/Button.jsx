import { motion } from "framer-motion";
import { pressTap, spring } from "../../design/motion.js";

const motionCache = new WeakMap();
const motionStringCache = new Map();
function asMotion(Tag) {
  if (!Tag || Tag === "button") return motion.button;
  if (typeof Tag === "string") {
    let comp = motionStringCache.get(Tag);
    if (!comp) {
      comp = motion[Tag] || motion.create(Tag);
      motionStringCache.set(Tag, comp);
    }
    return comp;
  }
  let comp = motionCache.get(Tag);
  if (!comp) {
    comp = motion.create(Tag);
    motionCache.set(Tag, comp);
  }
  return comp;
}

const VARIANT = {
  primary:
    "bg-[color:var(--color-primary-600)] text-white hover:bg-[color:var(--color-primary-700)] shadow-[var(--elev-2)]",
  secondary:
    "bg-[color:var(--color-surface-2)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-3)]",
  ghost:
    "bg-transparent text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-2)]",
  danger:
    "bg-[color:var(--color-sev-high)] text-white hover:opacity-90",
  accent:
    "bg-[color:var(--color-accent-400)] text-[color:var(--color-primary-950)] hover:bg-[color:var(--color-accent-500)]",
};

const SIZE = {
  sm: "h-9 px-3.5 text-sm rounded-xl",
  md: "h-11 px-4 text-[15px] rounded-xl",
  lg: "h-[52px] px-5 text-base rounded-2xl",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  icon,
  iconTrailing,
  children,
  className = "",
  disabled,
  fullWidth,
  ...props
}) {
  const MotionTag = asMotion(Tag);
  const isButton = Tag === "button";
  return (
    <MotionTag
      whileTap={disabled ? undefined : pressTap}
      transition={spring}
      disabled={isButton ? disabled : undefined}
      aria-disabled={!isButton && disabled ? true : undefined}
      className={`inline-flex items-center justify-center gap-2 font-medium transition select-none disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {icon}
      {children}
      {iconTrailing}
    </MotionTag>
  );
}

export function IconButton({
  icon,
  size = "md",
  variant = "ghost",
  "aria-label": ariaLabel,
  className = "",
  ...props
}) {
  const sizeCls =
    size === "sm" ? "h-9 w-9" : size === "lg" ? "h-12 w-12" : "h-11 w-11";
  return (
    <motion.button
      type="button"
      whileTap={pressTap}
      transition={spring}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-full transition ${VARIANT[variant]} ${sizeCls} ${className}`}
      {...props}
    >
      {icon}
    </motion.button>
  );
}
