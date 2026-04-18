import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { toFile } from "openai";
import { getOpenAI } from "../lib/openai.js";

function extFromMime(mime = "") {
  if (mime.includes("webm")) return ".webm";
  if (mime.includes("mp4")) return ".mp4";
  if (mime.includes("mpeg")) return ".mp3";
  if (mime.includes("wav")) return ".wav";
  if (mime.includes("ogg")) return ".ogg";
  return ".webm";
}

const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve("uploads"),
    filename: (_r, file, cb) => {
      const ext =
        path.extname(file.originalname) || extFromMime(file.mimetype);
      cb(null, `audio-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();

router.post("/", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "audio file required" });
  const openai = getOpenAI();
  if (!openai) {
    fs.unlink(req.file.path, () => {});
    return res.json({ text: "[Transcription unavailable — set OPENAI_API_KEY]" });
  }
  try {
    const filename = path.basename(req.file.path);
    const file = await toFile(fs.createReadStream(req.file.path), filename, {
      type: req.file.mimetype || "audio/webm",
    });
    const transcript = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });
    fs.unlink(req.file.path, () => {});
    res.json({ text: transcript.text });
  } catch (err) {
    console.error("transcribe error:", err.status || "", err.message);
    if (err.error) console.error("transcribe details:", err.error);
    fs.unlink(req.file.path, () => {});
    res.status(500).json({
      error: err?.error?.message || err.message || "Transcription failed",
    });
  }
});

export default router;
