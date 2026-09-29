// web/lib/inquiry/rateLimit.ts
// Cheapest adequate abuse control for /api/inquiry: a per-IP token bucket held in module scope (per serverless instance), enough to blunt naive floods.
const BUCKET = {capacity: 5, refillPerMs: 5 / 60_000} // 5 submissions per minute per IP
const buckets = new Map<string, {tokens: number; at: number}>()

export function allow(ip: string, now = Date.now()): boolean {
  const b = buckets.get(ip) ?? {tokens: BUCKET.capacity, at: now}
  b.tokens = Math.min(BUCKET.capacity, b.tokens + Math.max(0, now - b.at) * BUCKET.refillPerMs)
  b.at = Math.max(b.at, now) // a clock step-back neither drains the bucket now nor refills it when the clock recovers
  if (b.tokens < 1) { buckets.set(ip, b); return false }
  b.tokens -= 1
  buckets.set(ip, b)
  if (buckets.size > 5000) buckets.clear() // bounded memory
  return true
}
