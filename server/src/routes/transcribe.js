import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { getOpenAI } from "../lib/openai.js";

const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve("uploads"),
    filename: (_r, file, cb) => {
      const ext = path.extname(file.originalname) || ".webm";
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
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
    });
    fs.unlink(req.file.path, () => {});
    res.json({ text: transcript.text });
  } catch (err) {
    console.error("transcribe error:", err);
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: "Transcription failed" });
  }
});

export default router;
