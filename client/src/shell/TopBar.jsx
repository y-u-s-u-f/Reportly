import { Link, useLocation, useNavigate } from "react-router";
import { Moon, Sun, WifiOff, ChevronLeft } from "lucide-react";
import Logo from "../components/ui/Logo.jsx";
import { useAppStore } from "../store/index.js";
import { IconButton } from "../components/ui/Button.jsx";
import AdminLock from "./AdminLock.jsx";

const TITLES = {
  "/": "Reportly",
  "/map": "Map",
  "/activity": "Activity",
};

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const online = useAppStore((s) => s.online);
  const pending = useAppStore((s) => s.pending);
  const syncing = useAppStore((s) => s.syncing);

  const isDetail = pathname.startsWith("/r/");
  const title = isDetail ? "Report" : TITLES[pathname] || "Reportly";
  const hideOnMap = pathname === "/map";

  return (
    <header
      className={`sticky top-0 z-[1001] pt-safe ${
        hideOnMap
          ? "bg-transparent"
          : "bg-[color:var(--color-surface-0)]/85 backdrop-blur-xl border-b border-[color:var(--color-line)]"
      }`}
    >
      <div className="mx-auto max-w-2xl flex items-center justify-between gap-2 px-4 h-14">
        {isDetail ? (
          <IconButton
            icon={<ChevronLeft size={20} />}
            aria-label="Back"
            onClick={() => navigate(-1)}
          />
        ) : (
          <Link to="/" className="flex items-center gap-2 focus-ring rounded-xl">
            <Logo className="h-7 w-7" />
            <span className="font-display text-[22px] leading-none ink">
              {title}
            </span>
          </Link>
        )}
        <div className="flex items-center gap-1">
          <AdminLock />
          <IconButton
            icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            aria-label="Toggle theme"
            onClick={toggleTheme}
          />
        </div>
      </div>
      {!online && (
        <div className="bg-[color:var(--color-sev-med-soft)] text-[color:var(--color-sev-med)] px-4 py-2 text-[13px] flex items-center gap-2 border-t border-[color:var(--color-line)]">
          <WifiOff size={14} />
          <span>
            You're offline — reports will queue{pending ? ` (${pending} pending)` : ""}.
          </span>
        </div>
      )}
      {syncing && online && (
        <div className="bg-[color:var(--color-primary-50)] text-[color:var(--color-primary-700)] px-4 py-2 text-[13px]">
          Syncing queued reports…
        </div>
      )}
    </header>
  );
}
