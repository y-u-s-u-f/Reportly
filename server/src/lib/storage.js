import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";

const enabled = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET)
);

if (enabled) {
  cloudinary.config({ secure: true });
  console.log("[storage] Cloudinary enabled");
} else {
  console.log("[storage] Cloudinary not configured — using local /uploads");
}

export const cloudStorageEnabled = enabled;

export async function persistPhoto(file) {
  if (!enabled) {
    return `/uploads/${file.filename}`;
  }
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "reportly",
      resource_type: "image",
    });
    fs.unlink(file.path, () => {});
    return result.secure_url;
  } catch (err) {
    console.error("[storage] Cloudinary upload failed, falling back to local:", err.message);
    return `/uploads/${file.filename}`;
  }
}
