import { NavLink, useLocation, useNavigate } from "react-router";
import { Home, Map as MapIcon, Bell, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { pressTap, spring } from "../design/motion.js";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  function goReport() {
    navigate("/report", { state: { background: location } });
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[1001] pb-safe bg-[color:var(--color-surface-0)]/95 backdrop-blur-xl border-t border-[color:var(--color-line)]"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-2xl grid grid-cols-4 h-[68px] items-center">
        <TabItem to="/" icon={Home} label="Home" end />
        <TabItem to="/map" icon={MapIcon} label="Map" />
        <div className="relative h-full flex items-center justify-center">
          <motion.button
            type="button"
            whileTap={pressTap}
            transition={spring}
            onClick={goReport}
            aria-label="File a new report"
            className="h-14 w-14 rounded-full inline-flex items-center justify-center text-white shadow-[var(--elev-3)] bg-[color:var(--color-primary-600)] hover:bg-[color:var(--color-primary-700)] transition focus-ring"
          >
            <Plus size={26} strokeWidth={2.4} />
          </motion.button>
        </div>
        <TabItem to="/activity" icon={Bell} label="Activity" />
      </div>
    </nav>
  );
}

function TabItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition focus-ring rounded-xl ${
          isActive
            ? "text-[color:var(--color-primary-600)]"
            : "text-[color:var(--color-ink-subtle)] hover:text-[color:var(--color-ink)]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
