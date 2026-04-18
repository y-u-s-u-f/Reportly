import { Router } from "express";
import crypto from "node:crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "system123";
const tokens = new Set();

const router = Router();

router.post("/login", (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }
  const token = crypto.randomBytes(24).toString("hex");
  tokens.add(token);
  res.json({ token });
});

router.post("/logout", (req, res) => {
  const token = bearer(req);
  if (token) tokens.delete(token);
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const token = bearer(req);
  res.json({ admin: !!token && tokens.has(token) });
});

function bearer(req) {
  const auth = req.headers.authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export function requireAdmin(req, res, next) {
  const token = bearer(req);
  if (!token || !tokens.has(token)) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  next();
}

export default router;
