import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Lock, LogOut, ShieldCheck, Loader2, X } from "lucide-react";
import { adminLogin, adminLogout } from "../lib/api.js";
import { useAppStore } from "../store/index.js";
import Button, { IconButton } from "../components/ui/Button.jsx";

export default function AdminLock() {
  const admin = useAppStore((s) => s.admin);
  const pushToast = useAppStore((s) => s.pushToast);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e?.preventDefault();
    if (!password) return;
    setBusy(true);
    try {
      await adminLogin(password);
      pushToast("Signed in as admin", "success");
      setOpen(false);
      setPassword("");
    } catch (err) {
      pushToast(err.message || "Login failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await adminLogout();
    pushToast("Signed out", "default");
  }

  if (admin) {
    return (
      <IconButton
        icon={<LogOut size={18} />}
        aria-label="Sign out of admin"
        onClick={handleLogout}
      />
    );
  }

  return (
    <>
      <IconButton
        icon={<Lock size={18} />}
        aria-label="Sign in as admin"
        onClick={() => setOpen(true)}
      />
      {open && (
        <AdminSignInModal
          onClose={() => setOpen(false)}
          password={password}
          setPassword={setPassword}
          busy={busy}
          onSubmit={handleLogin}
        />
      )}
    </>
  );
}

function AdminSignInModal({ onClose, password, setPassword, busy, onSubmit }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Admin sign in"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm my-auto rounded-3xl bg-[color:var(--color-surface-0)] shadow-[var(--elev-4)] border line p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold ink leading-tight">
              Admin sign in
            </h2>
            <p className="text-[13px] ink-muted mt-0.5">
              Admins can edit reports and post live updates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 -mr-1 -mt-1 inline-flex items-center justify-center rounded-full hover:bg-[color:var(--color-surface-2)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-[color:var(--color-primary-600)] text-sm">
          <ShieldCheck size={16} /> Restricted to city staff.
        </div>
        <div>
          <label className="block text-[12px] font-medium ink-muted mb-1.5">
            Password
          </label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full rounded-xl border line bg-[color:var(--color-surface-1)] px-4 h-12 text-[15px] focus:outline-none focus:border-[color:var(--color-primary-500)]"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={busy || !password}
          icon={busy ? <Loader2 size={16} className="animate-spin" /> : null}
        >
          Sign in
        </Button>
      </form>
    </div>,
    document.body,
  );
}
