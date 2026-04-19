import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useAppStore } from "../../store/index.js";
import { spring } from "../../design/motion.js";

const ICON = {
  success: <CheckCircle2 size={18} className="text-[color:var(--color-accent-500)]" />,
  error: <AlertCircle size={18} className="text-[color:var(--color-sev-high)]" />,
  default: <Info size={18} className="text-[color:var(--color-primary-500)]" />,
};

export default function ToastStack() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);

  return (
    <div
      className="fixed inset-x-0 bottom-[96px] z-[3000] pointer-events-none flex flex-col items-center gap-2 px-4"
      role="region"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={spring}
            className="pointer-events-auto max-w-md w-full flex items-center gap-3 rounded-2xl bg-[color:var(--color-ink)] text-[color:var(--color-surface-0)] pl-4 pr-2 py-2.5 shadow-[var(--elev-4)]"
          >
            {ICON[t.variant] || ICON.default}
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="h-8 w-8 inline-flex items-center justify-center rounded-full opacity-60 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
