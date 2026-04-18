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
  "You are a city operations classifier. Given this civic issue description and image, return a JSON object with: { issueType: string, department: string, severity: 'low' | 'medium' | 'high', summary: string }. Department must be one of: Roads & Transport, Sanitation, Parks & Recreation, Utilities, Public Safety, Water & Drainage, General Services.";

export async function classifyReport({ description, imageBase64 }) {
  const openai = getOpenAI();
  if (!openai) return heuristicFallback(description);

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
    return heuristicFallback(description);
  }
}

function normalize(parsed, description) {
  const department = DEPARTMENTS.includes(parsed.department)
    ? parsed.department
    : "General Services";
  const severity = ["low", "medium", "high"].includes(parsed.severity)
    ? parsed.severity
    : "medium";
  return {
    issueType: parsed.issueType || "Other",
    department,
    severity,
    summary: parsed.summary || description?.slice(0, 140) || "Civic issue",
  };
}

function heuristicFallback(description = "") {
  const text = description.toLowerCase();
  let department = "General Services";
  let issueType = "Other";
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
  };
}
