export async function ensureNotificationPermission() {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notify(title, body) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/logo.svg" });
  } catch {
    /* ignore */
  }
}

export function statusLabel(status) {
  return (
    {
      received: "Received",
      assigned: "Assigned",
      in_progress: "In Progress",
      resolved: "Resolved",
    }[status] || status
  );
}
