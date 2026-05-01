import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv() : null;

const memoryStore = new Map();

const limits = {
  stories: { windowSec: 3600, max: 20 },
  prompts: { windowSec: 3600, max: 20 },
  render:  { windowSec: 3600, max: 5  },
};

export async function checkRateLimit(req, route) {
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.headers["x-real-ip"] || "unknown";

  const cfg = limits[route] || { windowSec: 3600, max: 10 };
  const key = `rl:${route}:${ip}`;

  if (redis) {
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.max, `${cfg.windowSec} s`),
      prefix: "scenecraft",
    });
    const { success, remaining, reset } = await rl.limit(key);
    return { ok: success, remaining, reset, ip };
  }

  const now = Date.now();
  const windowMs = cfg.windowSec * 1000;
  const entry = memoryStore.get(key) || { count: 0, start: now };
  if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
  entry.count += 1;
  memoryStore.set(key, entry);
  return {
    ok: entry.count <= cfg.max,
    remaining: Math.max(0, cfg.max - entry.count),
    reset: entry.start + windowMs, ip,
  };
}


---------------------------stories------------------------------------

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
