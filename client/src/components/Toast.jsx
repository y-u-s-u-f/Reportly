import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (message, kind = "info", durationMs = 3500) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, message, kind }]);
      setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed inset-x-0 bottom-24 z-[1000] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg max-w-sm w-full ${
              t.kind === "success"
                ? "bg-teal-500 text-white"
                : t.kind === "error"
                  ? "bg-red-600 text-white"
                  : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            }`}
          >
            {t.kind === "success" && <CheckCircle2 size={18} />}
            {t.kind === "error" && <AlertTriangle size={18} />}
            {t.kind === "info" && <Info size={18} />}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
