import { Router } from "express";
import { classifyReport } from "../lib/classify.js";

const router = Router();

router.post("/", async (req, res) => {
  const { description, image } = req.body || {};
  const imageBase64 = typeof image === "string"
    ? image.replace(/^data:image\/\w+;base64,/, "")
    : null;
  const result = await classifyReport({ description, imageBase64 });
  res.json(result);
});

export default router;
