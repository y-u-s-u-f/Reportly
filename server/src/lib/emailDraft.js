import { getOpenAI } from "./openai.js";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const emailCache = new Map(); // key: `${locality}::${department}` → { email, at }

function localityFromAddress(address = "") {
  // Nominatim display_name: "Street, City, County, State, ZIP, Country"
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    // Keep the last 3-4 segments: usually City, State/County, Country
    return parts.slice(-4).join(", ");
  }
  return address;
}

export async function findDepartmentEmail(report) {
  const openai = getOpenAI();
  const department = report.department || "General Services";
  const locality =
    localityFromAddress(report.address) ||
    (typeof report.latitude === "number" && typeof report.longitude === "number"
      ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
      : "");
  if (!locality || !openai) return null;

  const cacheKey = `${locality.toLowerCase()}::${department.toLowerCase()}`;
  const cached = emailCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.email;
  }

  const prompt =
    `Find the official public email address that a resident should use to file a ${department} complaint for the municipality serving "${locality}". ` +
    `Prefer a 311 or department-specific inbox published on the city's official .gov or equivalent website. ` +
    `Respond with ONLY the email address, no other text. If you cannot find one, respond with exactly: NONE`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: prompt,
    });
    const raw = (response.output_text || "").trim();
    const match = raw.match(EMAIL_RE);
    const email = match ? match[0].toLowerCase() : null;
    emailCache.set(cacheKey, { email, at: Date.now() });
    return email;
  } catch (err) {
    console.error("department email lookup error:", err.message);
    return null;
  }
}

function shape(report) {
  return {
    issueType: report.issueType,
    department: report.department,
    severity: report.severity,
    summary: report.summary,
    description: report.description,
    address: report.address,
    latitude: report.latitude,
    longitude: report.longitude,
    affectedCount: report.affectedCount,
    status: report.status,
    reportedAt: report.createdAt,
    photos: Array.isArray(report.photos) ? report.photos : [],
    comments: Array.isArray(report.comments)
      ? report.comments.map((c) => ({ text: c.text, at: c.createdAt }))
      : [],
  };
}

const EXAMPLE_INPUT = {
  issueType: "Pothole",
  department: "Roads & Transport",
  severity: "high",
  summary: "Deep pothole on Elm Street causing repeated vehicle damage.",
  description:
    "There is a massive pothole on Elm Street near the community center that has been there for over a month. Multiple cars have suffered tire and rim damage from it.",
  address: "123 Elm Street, Springfield",
  latitude: 40.7128,
  longitude: -74.006,
  affectedCount: 14,
  status: "received",
  reportedAt: "2026-03-15T12:00:00Z",
  photos: [
    "https://res.cloudinary.com/demo/image/upload/v1/reportly/pothole1.jpg",
  ],
  comments: [
    {
      text: "Nearly blew a tire this morning — this needs fixing now.",
      at: "2026-03-18T08:12:00Z",
    },
    {
      text: "My neighbor's rim got bent driving through it last night.",
      at: "2026-03-20T21:40:00Z",
    },
  ],
};

const EXAMPLE_OUTPUT = {
  subject: "URGENT: Dangerous pothole on Elm Street — 14+ residents affected",
  body: `Dear Roads & Transport Department,

I am writing to urgently request action on a dangerous pothole on Elm Street near the community center (approx. 123 Elm Street, Springfield). This hazard has been present for over a month and is actively causing damage to residents' vehicles.

Key facts:
- Location: 123 Elm Street, Springfield
- GPS: 40.71280, -74.00600
- First reported: 2026-03-15
- Residents affected: 14 and counting
- Severity: High — safety hazard

Neighbors have shared firsthand accounts in the report, including: "Nearly blew a tire this morning — this needs fixing now." and "My neighbor's rim got bent driving through it last night."

Photo evidence:
https://res.cloudinary.com/demo/image/upload/v1/reportly/pothole1.jpg

This is a public-safety issue. I am asking that the pothole be inspected and patched within the next 72 hours. Please confirm receipt of this complaint and share an expected repair date.

Thank you for your prompt attention.

Sincerely,
A concerned resident`,
};

const SYSTEM_PROMPT = `You draft urgent, professional civic complaint emails that citizens will send to their local government departments.

Tone: concerned, firm, factual, respectful. The email should sound like a reasonable resident who expects action. Use "URGENT:" as a subject prefix only when severity is 'high'.

Format the body as plain text with short paragraphs and a compact bullet list of key facts. Aim for 150-280 words. Always include:
- A greeting addressed to the department
- A one-sentence opening that states the problem and urgency
- A "Key facts:" bullet block (location, GPS if available, first-reported date, residents affected, severity)
- Direct quotes from resident comments if any strengthen the case
- Any photo URLs inline as plain links — the recipient will click them
- A specific, reasonable ask with a time window scaled to severity (e.g. "within 72 hours" for high, "within 10 business days" for low)
- A sign-off of "A concerned resident" (the user will replace with their own name)

Return ONLY JSON: { "subject": string, "body": string }. Do not include any other keys.`;

export async function draftAuthorityEmail(report) {
  const input = shape(report);
  const openai = getOpenAI();
  if (!openai) return heuristicDraft(input);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(EXAMPLE_INPUT) },
        { role: "assistant", content: JSON.stringify(EXAMPLE_OUTPUT) },
        { role: "user", content: JSON.stringify(input) },
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return {
      subject: parsed.subject || defaultSubject(input),
      body: parsed.body || heuristicDraft(input).body,
    };
  } catch (err) {
    console.error("email draft error:", err.message);
    return heuristicDraft(input);
  }
}

function defaultSubject(r) {
  const urgent = r.severity === "high" ? "URGENT: " : "";
  return `${urgent}${r.issueType || "Civic issue"}${r.address ? ` — ${r.address}` : ""}`;
}

function heuristicDraft(r) {
  const lines = [];
  lines.push(`Dear ${r.department || "City Operations"},`);
  lines.push("");
  lines.push(
    "I am writing to request urgent action on an ongoing civic issue that is affecting me and other residents in the area.",
  );
  lines.push("");
  lines.push("Key facts:");
  lines.push(`- Issue: ${r.issueType || "Civic issue"}`);
  lines.push(`- Severity: ${r.severity || "medium"}`);
  if (r.address) lines.push(`- Location: ${r.address}`);
  if (typeof r.latitude === "number" && typeof r.longitude === "number") {
    lines.push(`- GPS: ${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}`);
  }
  if (r.reportedAt) {
    lines.push(`- First reported: ${new Date(r.reportedAt).toISOString().slice(0, 10)}`);
  }
  lines.push(`- Residents affected: ${r.affectedCount ?? 1}`);
  lines.push("");
  if (r.description) {
    lines.push(`Description: ${r.description}`);
    lines.push("");
  }
  if ((r.comments || []).length > 0) {
    lines.push("Resident comments:");
    for (const c of r.comments.slice(0, 3)) lines.push(`- "${c.text}"`);
    lines.push("");
  }
  if ((r.photos || []).length > 0) {
    lines.push("Photo evidence:");
    for (const p of r.photos.slice(0, 3)) lines.push(p);
    lines.push("");
  }
  lines.push(
    "Please acknowledge receipt of this complaint and provide an estimated response date. Given the impact, I would appreciate a reply within 7 business days.",
  );
  lines.push("");
  lines.push("Sincerely,");
  lines.push("A concerned resident");

  return {
    subject: defaultSubject(r),
    body: lines.join("\n"),
  };
}
