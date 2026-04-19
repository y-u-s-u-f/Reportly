export function reportShareUrl(id) {
  if (typeof window === "undefined") return `/r/${id}`;
  return `${window.location.origin}/r/${id}`;
}

export async function shareReport(report) {
  const url = reportShareUrl(report.id);
  const title = `Reportly — ${report.issueType || "Civic issue"}`;
  const text = report.summary || report.description || "View this civic report";
  if (navigator.share) {
    try {
      await navigator.share({ url, title, text });
      return { shared: true };
    } catch {
      return { shared: false };
    }
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return { copied: true };
  }
  return { url };
}
