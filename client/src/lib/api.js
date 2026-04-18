import { authHeaders, setToken } from "./auth.js";
import { getDeviceId } from "./device.js";

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function assetUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

function handleAuthResponse(res) {
  if (res.status === 401) {
    setToken(null);
    throw new Error("Session expired — please sign in again");
  }
  return res;
}

export async function adminLogin(password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Login failed");
  }
  const { token } = await res.json();
  setToken(token);
  return token;
}

export async function adminLogout() {
  try {
    await fetch(`${BASE}/api/auth/logout`, {
      method: "POST",
      headers: authHeaders(),
    });
  } catch {
    /* ignore */
  }
  setToken(null);
}

export async function fetchReports() {
  const res = await fetch(`${BASE}/api/reports`);
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function submitReport({ description, latitude, longitude, address, photos }) {
  const fd = new FormData();
  fd.append("description", description || "");
  fd.append("latitude", String(latitude));
  fd.append("longitude", String(longitude));
  if (address) fd.append("address", address);
  fd.append("userId", getDeviceId());
  for (const p of photos || []) fd.append("photos", p);

  const res = await fetch(`${BASE}/api/reports`, { method: "POST", body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || "Failed to submit report");
    err.status = res.status;
    err.needsMoreInfo = !!data.needsMoreInfo;
    throw err;
  }
  return res.json();
}

export async function transcribeAudio(blob, filename = "voice.webm") {
  const fd = new FormData();
  fd.append("audio", blob, filename);
  const res = await fetch(`${BASE}/api/transcribe`, { method: "POST", body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Transcription failed");
  }
  return res.json();
}

export async function updateStatus(id, status) {
  const res = await fetch(`${BASE}/api/reports/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(status ? { status } : {}),
  });
  handleAuthResponse(res);
  if (!res.ok) throw new Error("Status update failed");
  return res.json();
}

export async function updateReport(id, fields) {
  const res = await fetch(`${BASE}/api/reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(fields),
  });
  handleAuthResponse(res);
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export async function postStatusUpdate(id, text) {
  const res = await fetch(`${BASE}/api/reports/${id}/status-updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ text }),
  });
  handleAuthResponse(res);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to post update");
  }
  return res.json();
}

export async function deleteReport(id) {
  const res = await fetch(`${BASE}/api/reports/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  handleAuthResponse(res);
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export async function upvoteReport(id) {
  const res = await fetch(`${BASE}/api/reports/${id}/upvote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: getDeviceId() }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upvote failed");
  }
  return res.json();
}

export async function addPhotosToReport(id, files) {
  const fd = new FormData();
  for (const f of files) fd.append("photos", f);
  const res = await fetch(`${BASE}/api/reports/${id}/photos`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }
  return res.json();
}

export async function draftAuthorityEmail(id) {
  const res = await fetch(`${BASE}/api/reports/${id}/email-draft`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to draft email");
  }
  return res.json();
}

export async function addComment(id, text) {
  const res = await fetch(`${BASE}/api/reports/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Comment failed");
  }
  return res.json();
}

export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

export async function forwardGeocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    const hit = data[0];
    return {
      lat: parseFloat(hit.lat),
      lon: parseFloat(hit.lon),
      address: hit.display_name,
    };
  } catch {
    return null;
  }
}
