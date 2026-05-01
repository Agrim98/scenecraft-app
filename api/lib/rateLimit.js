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
