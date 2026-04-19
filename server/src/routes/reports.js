import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { prisma } from "../lib/prisma.js";
import { classifyReport } from "../lib/classify.js";
import { haversineMeters } from "../lib/geo.js";
import { persistPhoto } from "../lib/storage.js";
import { draftAuthorityEmail, findDepartmentEmail } from "../lib/emailDraft.js";
import { requireAdmin } from "./auth.js";

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
const MILE_M = 1609.344;
const DUPLICATE_RADIUS_M = 0.5 * MILE_M;

router.get("/", async (_req, res) => {
  const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" } });
  res.json(reports);
});

router.get("/nearby", async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const issueType = req.query.issueType;
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: "lat and lon required" });
  }
  const candidates = await prisma.report.findMany({
    where: {
      status: { not: "resolved" },
      ...(issueType ? { issueType } : {}),
    },
  });
  const nearby = candidates
    .map((r) => ({ ...r, distance: haversineMeters(lat, lon, r.latitude, r.longitude) }))
    .filter((r) => r.distance <= DUPLICATE_RADIUS_M)
    .sort((a, b) => a.distance - b.distance);
  res.json(nearby);
});

router.post("/", upload.array("photos", 3), async (req, res) => {
  try {
    const { description = "", latitude, longitude, address, userId } = req.body;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: "latitude and longitude required" });
    }

    let imageBase64 = null;
    if (req.files && req.files[0]) {
      imageBase64 = fs.readFileSync(req.files[0].path).toString("base64");
    }

    const classification = await classifyReport({ description, imageBase64 });

    if (classification.needsMoreInfo) {
      return res.status(422).json({
        error:
          "Not enough information to classify — please add a clearer photo, a description, or a voice note.",
        needsMoreInfo: true,
      });
    }

    const photos = await Promise.all((req.files || []).map(persistPhoto));

    const candidates = await prisma.report.findMany({
      where: { status: { not: "resolved" } },
    });
    const newType = (classification.issueType || "").toLowerCase().trim();
    const duplicate = candidates
      .filter((r) => (r.issueType || "").toLowerCase().trim() === newType)
      .map((r) => ({ r, distance: haversineMeters(lat, lon, r.latitude, r.longitude) }))
      .filter((x) => x.distance <= DUPLICATE_RADIUS_M)
      .sort((a, b) => a.distance - b.distance)[0]?.r;

    if (duplicate) {
      const mergedPhotos = Array.from(
        new Set([...(duplicate.photos || []), ...photos]),
      );
      const mergedComments = Array.isArray(duplicate.comments)
        ? [...duplicate.comments]
        : [];
      const trimmed = (description || "").trim();
      if (trimmed) {
        mergedComments.push({
          text: trimmed,
          createdAt: new Date().toISOString(),
        });
      }

      const submitterId = (userId || "").trim();
      const existingUpvoters = Array.isArray(duplicate.upvoterIds)
        ? duplicate.upvoterIds
        : [];
      const alreadyCounted =
        submitterId &&
        (duplicate.userId === submitterId ||
          existingUpvoters.includes(submitterId));

      const updateData = {
        photos: mergedPhotos,
        comments: mergedComments,
      };
      if (submitterId && !alreadyCounted) {
        updateData.affectedCount = { increment: 1 };
        updateData.upvoterIds = { set: [...existingUpvoters, submitterId] };
      }

      const updated = await prisma.report.update({
        where: { id: duplicate.id },
        data: updateData,
      });
      return res.json({
        report: updated,
        duplicate: true,
        classification,
        alreadyCounted,
      });
    }

    const report = await prisma.report.create({
      data: {
        userId: userId || null,
        description,
        latitude: lat,
        longitude: lon,
        address: address || null,
        photos,
        issueType: classification.issueType,
        department: classification.department,
        severity: classification.severity,
        summary: classification.summary,
      },
    });

    res.json({ report, duplicate: false, classification });
  } catch (err) {
    console.error("create report error:", err);
    res.status(500).json({ error: "Failed to create report" });
  }
});

const STATUS_FLOW = ["received", "assigned", "in_progress", "resolved"];
const SEVERITIES = ["low", "medium", "high"];

router.post("/:id/upvote", async (req, res) => {
  try {
    const userId = String(req.body?.userId || "").trim();
    if (!userId) return res.status(400).json({ error: "Missing device id" });
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: "Report not found" });
    if (report.userId && report.userId === userId) {
      return res.status(403).json({ error: "You can't upvote your own report" });
    }
    const existing = Array.isArray(report.upvoterIds) ? report.upvoterIds : [];
    if (existing.includes(userId)) {
      return res.status(409).json({ error: "You already upvoted this" });
    }
    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        affectedCount: { increment: 1 },
        upvoterIds: { set: [...existing, userId] },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error("upvote error:", err);
    res.status(500).json({ error: "Failed to upvote" });
  }
});

router.post("/:id/photos", upload.array("photos", 3), async (req, res) => {
  try {
    const newPhotos = await Promise.all((req.files || []).map(persistPhoto));
    if (newPhotos.length === 0) {
      return res.status(400).json({ error: "No photos uploaded" });
    }
    const current = await prisma.report.findUnique({
      where: { id: req.params.id },
      select: { photos: true },
    });
    if (!current) return res.status(404).json({ error: "Report not found" });
    const merged = Array.from(new Set([...(current.photos || []), ...newPhotos]));
    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: { photos: merged },
    });
    res.json(updated);
  } catch (err) {
    console.error("add photos error:", err);
    res.status(500).json({ error: "Failed to add photos" });
  }
});

router.post("/:id/email-draft", async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
    });
    if (!report) return res.status(404).json({ error: "Report not found" });
    const [{ subject, body }, lookedUpEmail] = await Promise.all([
      draftAuthorityEmail(report),
      findDepartmentEmail(report),
    ]);
    const to = lookedUpEmail || "311@yourcity.gov";
    res.json({ to, subject, body });
  } catch (err) {
    console.error("email draft error:", err);
    res.status(500).json({ error: "Failed to draft email" });
  }
});

router.post("/:id/comments", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "text required" });
    if (text.length > 500) {
      return res.status(400).json({ error: "comment too long (max 500 chars)" });
    }
    const current = await prisma.report.findUnique({
      where: { id: req.params.id },
      select: { comments: true },
    });
    if (!current) return res.status(404).json({ error: "Report not found" });
    const next = Array.isArray(current.comments) ? [...current.comments] : [];
    next.push({ text, createdAt: new Date().toISOString() });
    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: { comments: next },
    });
    res.json(updated);
  } catch (err) {
    console.error("add comment error:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    let nextStatus = status;
    if (!nextStatus) {
      const current = await prisma.report.findUnique({ where: { id } });
      if (!current) return res.status(404).json({ error: "Report not found" });
      const idx = STATUS_FLOW.indexOf(current.status);
      nextStatus = STATUS_FLOW[(idx + 1) % STATUS_FLOW.length];
    }
    if (!STATUS_FLOW.includes(nextStatus)) {
      return res.status(400).json({ error: "invalid status" });
    }
    const updated = await prisma.report.update({
      where: { id },
      data: { status: nextStatus },
    });
    res.json(updated);
  } catch (err) {
    console.error("status update error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["status", "severity", "department", "issueType", "summary", "description"];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.status && !STATUS_FLOW.includes(data.status)) {
      return res.status(400).json({ error: "invalid status" });
    }
    if (data.severity && !SEVERITIES.includes(data.severity)) {
      return res.status(400).json({ error: "invalid severity" });
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "no fields to update" });
    }
    const updated = await prisma.report.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    console.error("update error:", err);
    res.status(500).json({ error: "Failed to update report" });
  }
});

router.post("/:id/status-updates", requireAdmin, async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "text required" });
    if (text.length > 500) {
      return res.status(400).json({ error: "update too long (max 500 chars)" });
    }
    const current = await prisma.report.findUnique({
      where: { id: req.params.id },
      select: { statusUpdates: true },
    });
    if (!current) return res.status(404).json({ error: "Report not found" });
    const next = Array.isArray(current.statusUpdates)
      ? [...current.statusUpdates]
      : [];
    next.push({ text, createdAt: new Date().toISOString() });
    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: { statusUpdates: next },
    });
    res.json(updated);
  } catch (err) {
    console.error("status-update post error:", err);
    res.status(500).json({ error: "Failed to post update" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.report.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("delete error:", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

export default router;
