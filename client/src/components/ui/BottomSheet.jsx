import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { spring, fadeMotion } from "../../design/motion.js";
import { X } from "lucide-react";

export default function BottomSheet({
  open,
  onClose,
  children,
  title,
  subtitle,
  showHandle = true,
  closeOnBackdrop = true,
  size = "auto",
  "aria-label": ariaLabel,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const height =
    size === "full"
      ? "h-[100dvh]"
      : size === "lg"
        ? "max-h-[92dvh]"
        : size === "sm"
          ? "max-h-[50dvh]"
          : "max-h-[85dvh]";

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[2000]"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel || title || "Sheet"}
        >
          <motion.button
            type="button"
            aria-label="Close"
            onClick={() => closeOnBackdrop && onClose?.()}
            {...fadeMotion}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />
          <motion.div
            ref={ref}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140 || info.velocity.y > 700) onClose?.();
            }}
            className={`absolute left-0 right-0 bottom-0 flex flex-col bg-[color:var(--color-surface-0)] rounded-t-[32px] shadow-[var(--elev-4)] ${height} overflow-hidden`}
          >
            {showHandle && (
              <div className="pt-2 pb-1 flex-shrink-0 flex justify-center">
                <span className="block h-1.5 w-10 rounded-full bg-[color:var(--color-line-strong)]" />
              </div>
            )}
            {(title || subtitle) && (
              <div className="px-5 pt-2 pb-3 flex-shrink-0 flex items-start justify-between gap-3 border-b border-[color:var(--color-line)]">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-[17px] font-semibold ink leading-tight">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-[13px] ink-muted mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="h-9 w-9 -mr-2 inline-flex items-center justify-center rounded-full hover:bg-[color:var(--color-surface-2)]"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto scroll-subtle">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SheetBody({ children, className = "" }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function SheetFooter({ children, className = "" }) {
  return (
    <div
      className={`sticky bottom-0 px-5 py-3 pb-safe bg-[color:var(--color-surface-0)] border-t border-[color:var(--color-line)] ${className}`}
    >
      {children}
    </div>
  );
}
