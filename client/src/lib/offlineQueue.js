import { submitReport } from "./api.js";

const KEY = "reportly:queue";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function dataUrlToFile(dataUrl, name) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type });
}

export function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export async function enqueueReport(payload) {
  const photos = await Promise.all(
    (payload.photos || []).map(async (file, i) => ({
      name: file.name || `photo-${i}.jpg`,
      dataUrl: await fileToDataUrl(file),
    })),
  );
  const item = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    queuedAt: Date.now(),
    description: payload.description,
    latitude: payload.latitude,
    longitude: payload.longitude,
    address: payload.address,
    photos,
  };
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
  return item;
}

export async function flushQueue(onProgress) {
  const queue = readQueue();
  if (queue.length === 0) return { sent: 0, failed: 0 };
  let sent = 0;
  let failed = 0;
  const remaining = [];
  for (const item of queue) {
    try {
      const photos = await Promise.all(
        item.photos.map((p) => dataUrlToFile(p.dataUrl, p.name)),
      );
      await submitReport({ ...item, photos });
      sent++;
      onProgress?.({ sent, failed, total: queue.length });
    } catch {
      failed++;
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return { sent, failed };
}

export function queueSize() {
  return readQueue().length;
}
