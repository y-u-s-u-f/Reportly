import { create } from "zustand";
import { isAdmin, onAuthChange } from "../lib/auth.js";
import { queueSize } from "../lib/offlineQueue.js";

const initialTheme = (() => {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("reportly:theme");
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
})();

const initialOnline =
  typeof navigator !== "undefined" ? navigator.onLine : true;

const initialViewMode = (() => {
  if (typeof window === "undefined") return "list";
  const stored = localStorage.getItem("reportly:view");
  return stored === "grid" || stored === "list" ? stored : "list";
})();

export const useAppStore = create((set, get) => ({
  theme: initialTheme,
  online: initialOnline,
  pending: queueSize(),
  syncing: false,
  admin: isAdmin(),
  refreshKey: 0,
  toasts: [],
  viewMode: initialViewMode,

  setTheme: (theme) => {
    localStorage.setItem("reportly:theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
  setOnline: (online) => set({ online }),
  setPending: (pending) => set({ pending }),
  setSyncing: (syncing) => set({ syncing }),
  setAdmin: (admin) => set({ admin }),
  refresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
  setViewMode: (mode) => {
    if (mode !== "grid" && mode !== "list") return;
    localStorage.setItem("reportly:view", mode);
    set({ viewMode: mode });
  },

  pushToast: (message, variant = "default") => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3600);
    return id;
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function bindAppStoreSideEffects() {
  if (typeof window === "undefined") return () => {};
  const store = useAppStore;
  document.documentElement.classList.toggle(
    "dark",
    store.getState().theme === "dark",
  );
  const offAuth = onAuthChange(() => store.setState({ admin: isAdmin() }));
  const onOn = () => store.setState({ online: true });
  const onOff = () => store.setState({ online: false });
  window.addEventListener("online", onOn);
  window.addEventListener("offline", onOff);
  return () => {
    offAuth();
    window.removeEventListener("online", onOn);
    window.removeEventListener("offline", onOff);
  };
}

export function useToast() {
  return useAppStore((s) => s.pushToast);
}
