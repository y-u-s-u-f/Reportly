import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import reportsRouter from "./routes/reports.js";
import transcribeRouter from "./routes/transcribe.js";
import classifyRouter from "./routes/classify.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/transcribe", transcribeRouter);
app.use("/api/classify", classifyRouter);

app.listen(PORT, () => {
  console.log(`Reportly API listening on http://localhost:${PORT}`);
});
