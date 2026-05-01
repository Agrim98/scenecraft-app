import { checkRateLimit } from "../_lib/rateLimit.js";
import { validateAndSanitize } from "../_lib/validate.js";

export const config = { api: { bodyParser: { sizeLimit: "30mb" } } };

export default async function handler(req, res) {
  return forward(req, res, "stories", "scenecraft/stories");
}

export async function forward(req, res, route, n8nPath) {
  const origin = req.headers.origin || "";
  const allowed = process.env.ALLOWED_ORIGIN;

  if (req.method === "OPTIONS") {
    if (origin === allowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Same-origin OR explicit allowed origin
  if (origin && origin !== allowed) return res.status(403).json({ error: "Forbidden origin" });
  if (allowed) res.setHeader("Access-Control-Allow-Origin", allowed);

  try {
    const rl = await checkRateLimit(req, route);
    res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
    if (!rl.ok) return res.status(429).json({ error: "Too many requests, try later" });

    const safeBody = validateAndSanitize(req.body || {}, route);

    const r = await fetch(`${process.env.N8N_BASE_URL}/${n8nPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.N8N_SHARED_SECRET,
      },
      body: JSON.stringify(safeBody),
    });

    const text = await r.text();
    res.status(r.status);
    try { return res.json(JSON.parse(text)); } catch { return res.send(text); }
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Server error" });
  }
}
