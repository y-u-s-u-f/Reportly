import { useEffect, useState } from "react";
import { Lock, LogOut, ShieldCheck, X, Loader2 } from "lucide-react";
import { adminLogin, adminLogout } from "../lib/api.js";
import { isAdmin, onAuthChange } from "../lib/auth.js";
import { useToast } from "./Toast.jsx";

export default function AdminBar() {
  const [admin, setAdmin] = useState(isAdmin());
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => onAuthChange(() => setAdmin(isAdmin())), []);

  async function handleLogin(e) {
    e?.preventDefault();
    if (!password) return;
    setBusy(true);
    try {
      await adminLogin(password);
      toast.show("Signed in as admin", "success");
      setOpen(false);
      setPassword("");
    } catch (err) {
      toast.show(err.message || "Login failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await adminLogout();
    toast.show("Signed out", "info");
  }

  if (admin) {
    return (
      <div className="flex items-center gap-1">
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 px-2.5 py-1 text-xs font-semibold">
          <ShieldCheck size={12} /> Admin
        </span>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Sign in as admin"
        className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <Lock size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[1100] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-500" />
                Admin sign in
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-zinc-500">
              Admins can edit and delete any report.
            </p>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={busy || !password}
              className="w-full min-h-[48px] rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold inline-flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              Sign in
            </button>
          </form>
        </div>
      )}
    </>
  );
}
