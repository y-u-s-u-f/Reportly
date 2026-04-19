import { useState } from "react";
import { Lock, LogOut, ShieldCheck, Loader2 } from "lucide-react";
import { adminLogin, adminLogout } from "../lib/api.js";
import { useAppStore } from "../store/index.js";
import BottomSheet, { SheetBody, SheetFooter } from "../components/ui/BottomSheet.jsx";
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
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Admin sign in"
        subtitle="Admins can edit reports and post live updates that residents see."
        size="sm"
      >
        <form onSubmit={handleLogin}>
          <SheetBody>
            <div className="mb-4 flex items-center gap-2 text-[color:var(--color-primary-600)] text-sm">
              <ShieldCheck size={16} /> Restricted to city staff.
            </div>
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
          </SheetBody>
          <SheetFooter>
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={busy || !password}
              icon={busy ? <Loader2 size={16} className="animate-spin" /> : null}
            >
              Sign in
            </Button>
          </SheetFooter>
        </form>
      </BottomSheet>
    </>
  );
}
