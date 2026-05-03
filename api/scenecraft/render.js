// api/scenecraft/render.js — V7 Async
import { checkRateLimit } from "../lib/rateLimit.js";
import { validateAndSanitize } from "../lib/validate.js";

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_SHARED_SECRET = process.env.N8N_SHARED_SECRET;

export const config = { api: { bodyParser: { sizeLimit: "30mb" } } };

export default async function handler(req, res) {
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
  if (origin && origin !== allowed) return res.status(403).json({ error: "Forbidden origin" });
  if (allowed) res.setHeader("Access-Control-Allow-Origin", allowed);

  try {
    const rl = await checkRateLimit(req, "render");
    res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
    if (!rl.ok) return res.status(429).json({ error: "Too many requests, try later" });

    const safeBody = validateAndSanitize(req.body || {}, "render");

    const n8nResponse = await fetch(
      `${N8N_BASE_URL}/scenecraft/render`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": N8N_SHARED_SECRET,
        },
        body: JSON.stringify(safeBody),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!n8nResponse.ok) throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
    const text = await n8nResponse.text();
    res.status(202);
    try { return res.json(JSON.parse(text)); } catch { return res.send(text); }

  } catch (err) {
    console.error("[render]", err.message);
    return res.status(500).json({ error: "Failed to start render", detail: err.message });
  }
}
