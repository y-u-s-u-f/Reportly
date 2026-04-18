const EARTH_RADIUS_M = 6_371_000;
export const MILE_M = 1609.344;

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function formatDistance(meters) {
  const mi = meters / MILE_M;
  if (mi < 0.1) return `${Math.round(meters)} m`;
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

export async function ipGeolocate() {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    return null;
  } catch {
    return null;
  }
}
