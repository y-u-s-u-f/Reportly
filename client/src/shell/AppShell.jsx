import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import TopBar from "./TopBar.jsx";
import BottomNav from "./BottomNav.jsx";
import ToastStack from "../components/ui/Toast.jsx";
import Onboarding, { hasOnboarded } from "./Onboarding.jsx";
import { useAppStore } from "../store/index.js";
import { flushQueue, queueSize } from "../lib/offlineQueue.js";
import { ensureNotificationPermission } from "../lib/notify.js";

export default function AppShell() {
  const { pathname } = useLocation();
  const online = useAppStore((s) => s.online);
  const setPending = useAppStore((s) => s.setPending);
  const setSyncing = useAppStore((s) => s.setSyncing);
  const refresh = useAppStore((s) => s.refresh);
  const pushToast = useAppStore((s) => s.pushToast);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    if (hasOnboarded()) return false;
    // Skip onboarding on deep-linked report pages — let shared links open clean.
    return !window.location.pathname.startsWith("/r/");
  });

  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  useEffect(() => {
    if (!online) return;
    if (queueSize() === 0) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      const result = await flushQueue();
      if (cancelled) return;
      setSyncing(false);
      setPending(queueSize());
      if (result.sent > 0) {
        pushToast(
          `Synced ${result.sent} queued report${result.sent === 1 ? "" : "s"}`,
          "success",
        );
        refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [online, setSyncing, setPending, refresh, pushToast]);

  const isMap = pathname === "/map";

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--color-surface-1)] text-[color:var(--color-ink)]">
      <TopBar />
      <main
        className={`flex-1 mx-auto w-full max-w-2xl ${isMap ? "pb-0" : "pb-[88px]"}`}
      >
        <Outlet />
      </main>
      <BottomNav />
      <ToastStack />
      {showOnboarding && (
        <Onboarding onDone={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
