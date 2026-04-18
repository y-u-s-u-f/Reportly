import { getOpenAI } from "./openai.js";

const DEPARTMENTS = [
  "Roads & Transport",
  "Sanitation",
  "Parks & Recreation",
  "Utilities",
  "Public Safety",
  "Water & Drainage",
  "General Services",
];

const SYSTEM_PROMPT =
  "You are a city operations classifier. Given a civic issue description and/or photo, return JSON: { issueType: string, department: string, severity: 'low' | 'medium' | 'high', summary: string, needsMoreInfo: boolean }.\n" +
  "\n" +
  "Decide needsMoreInfo first:\n" +
  "- Set needsMoreInfo = true ONLY when both the description and the image are missing, empty, random gibberish (e.g. 'asdfhk'), unrelated to civic issues, or otherwise give no evidence of an actual civic problem.\n" +
  "- Set needsMoreInfo = false if the photo clearly shows a civic issue OR the description names one — either signal is enough.\n" +
  "- If needsMoreInfo is true, you may leave issueType/department/severity/summary empty; they will be ignored.\n" +
  "\n" +
  "When needsMoreInfo is false:\n" +
  "- issueType: a short (1-3 word) specific category in Title Case, e.g. 'Pothole', 'Broken Streetlight', 'Illegal Dumping', 'Graffiti', 'Water Leak', 'Flooding', 'Downed Tree', 'Damaged Sidewalk', 'Abandoned Vehicle', 'Noise Complaint', 'Broken Signage', 'Fallen Branch', 'Vehicle Accident'. Never answer 'Unknown', 'Other', 'N/A', or empty — pick the closest plausible civic category.\n" +
  "- department: one of Roads & Transport, Sanitation, Parks & Recreation, Utilities, Public Safety, Water & Drainage, General Services.\n" +
  "- severity: 'low' for cosmetic/minor, 'medium' for a nuisance that should be addressed soon, 'high' for a safety hazard or emergency.\n" +
  "- summary: one sentence under 140 chars describing the issue in plain language.";

export async function classifyReport({ description, imageBase64 }) {
  const openai = getOpenAI();
  if (!openai) return heuristicFallback(description, !!imageBase64);

  const userContent = [{ type: "text", text: description || "(no description)" }];
  if (imageBase64) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return normalize(parsed, description);
  } catch (err) {
    console.error("classify error:", err.message);
    return heuristicFallback(description, !!imageBase64);
  }
}

const VAGUE_ISSUE = /^(unknown|other|n\/?a|none|unclear)$/i;

function titleCase(s) {
  return s
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function normalize(parsed, description) {
  if (parsed.needsMoreInfo === true) {
    return { needsMoreInfo: true };
  }

  const department = DEPARTMENTS.includes(parsed.department)
    ? parsed.department
    : "General Services";
  const severity = ["low", "medium", "high"].includes(parsed.severity)
    ? parsed.severity
    : "medium";

  const rawIssue = (parsed.issueType || "").trim();
  const useFallbackType = !rawIssue || VAGUE_ISSUE.test(rawIssue);
  const fallback = heuristicFallback(description);
  const issueType = useFallbackType ? fallback.issueType : titleCase(rawIssue);

  return {
    issueType,
    department,
    severity,
    summary: parsed.summary || description?.slice(0, 140) || "Civic issue",
    needsMoreInfo: false,
  };
}

function heuristicFallback(description = "", hasImage = false) {
  const text = description.toLowerCase().trim();
  if (text.length < 3 && !hasImage) {
    return { needsMoreInfo: true };
  }
  let department = "General Services";
  let issueType = "Civic Issue";
  if (/(pothole|road|street|traffic|sign|crosswalk)/.test(text)) {
    department = "Roads & Transport";
    issueType = "Road Damage";
  } else if (/(trash|garbage|litter|dump|bin)/.test(text)) {
    department = "Sanitation";
    issueType = "Waste Issue";
  } else if (/(park|tree|playground|graffiti)/.test(text)) {
    department = "Parks & Recreation";
    issueType = "Park Maintenance";
  } else if (/(power|outage|street ?light|electric|wire)/.test(text)) {
    department = "Utilities";
    issueType = "Utility Outage";
  } else if (/(unsafe|crime|fire|hazard|danger)/.test(text)) {
    department = "Public Safety";
    issueType = "Safety Hazard";
  } else if (/(water|leak|flood|drain|sewer)/.test(text)) {
    department = "Water & Drainage";
    issueType = "Water Issue";
  }
  return {
    issueType,
    department,
    severity: "medium",
    summary: description.slice(0, 140) || "Civic issue",
    needsMoreInfo: false,
  };
}
