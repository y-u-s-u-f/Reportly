import { useEffect, useState, useCallback } from "react";
import { Moon, Sun, FileEdit, Map as MapIcon, BarChart2, WifiOff } from "lucide-react";
import Logo from "./components/Logo.jsx";
import AdminBar from "./components/AdminBar.jsx";
import { ToastProvider, useToast } from "./components/Toast.jsx";
import QuickSubmitTab from "./tabs/QuickSubmitTab.jsx";
import MapTab from "./tabs/MapTab.jsx";
import DashboardTab from "./tabs/DashboardTab.jsx";
import { ensureNotificationPermission } from "./lib/notify.js";
import { flushQueue, queueSize } from "./lib/offlineQueue.js";
import { isAdmin, onAuthChange } from "./lib/auth.js";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("reportly:theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("reportly:theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, setDark];
}

function AppShell() {
  const [tab, setTab] = useState("submit");
  const [dark, setDark] = useDarkMode();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(queueSize());
  const [refreshKey, setRefreshKey] = useState(0);
  const [admin, setAdmin] = useState(isAdmin());
  const toast = useToast();

  useEffect(() => onAuthChange(() => setAdmin(isAdmin())), []);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const trySync = useCallback(async () => {
    if (queueSize() === 0) return;
    setSyncing(true);
    const result = await flushQueue();
    setSyncing(false);
    setPending(queueSize());
    if (result.sent > 0) {
      toast.show(`Synced ${result.sent} queued report${result.sent === 1 ? "" : "s"}`, "success");
      triggerRefresh();
    }
  }, [toast, triggerRefresh]);

  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      trySync();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [trySync]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="text-lg font-bold text-teal-500 dark:text-teal-300 tracking-tight">
              Reportly
            </span>
          </div>
          <div className="flex items-center gap-1">
            <AdminBar />
            <button
              type="button"
              onClick={() => setDark(!dark)}
              aria-label="Toggle dark mode"
              className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
        {!online && (
          <div className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 px-4 py-2 text-sm flex items-center gap-2">
            <WifiOff size={16} />
            <span>You are offline — reports will be queued{pending ? ` (${pending} pending)` : ""}.</span>
          </div>
        )}
        {syncing && online && (
          <div className="bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 px-4 py-2 text-sm">
            Syncing queued reports…
          </div>
        )}
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl pb-24">
        {tab === "submit" && (
          <QuickSubmitTab
            online={online}
            onQueueChange={() => setPending(queueSize())}
            onSubmitted={triggerRefresh}
          />
        )}
        {tab === "map" && <MapTab refreshKey={refreshKey} />}
        {tab === "dashboard" && (
          <DashboardTab
            refreshKey={refreshKey}
            onChange={triggerRefresh}
            admin={admin}
          />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-2xl relative grid grid-cols-2">
          <TabButton
            active={tab === "dashboard"}
            onClick={() => setTab("dashboard")}
            icon={<BarChart2 size={22} />}
            label="Dashboard"
          />
          <TabButton
            active={tab === "map"}
            onClick={() => setTab("map")}
            icon={<MapIcon size={22} />}
            label="Map"
          />
          <button
            type="button"
            onClick={() => setTab("submit")}
            aria-label="Quick submit"
            className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full shadow-lg inline-flex items-center justify-center text-white transition ${
              tab === "submit"
                ? "bg-teal-600 ring-4 ring-teal-500/30"
                : "bg-teal-500 hover:bg-teal-600"
            }`}
          >
            <FileEdit size={26} />
          </button>
        </div>
      </nav>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[64px] flex flex-col items-center justify-center gap-1 text-xs font-medium transition ${
        active
          ? "text-teal-500 dark:text-teal-300"
          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}
