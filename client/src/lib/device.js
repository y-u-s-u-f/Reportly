const KEY = "reportly:device-id";

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        "dev_" +
        Math.random().toString(36).slice(2, 10) +
        Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
