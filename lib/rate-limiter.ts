import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Ensure environment variables are loaded. In Next.js, they are available server-side.
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn("Upstash Redis environment variables not found. Rate limiting will be disabled.")
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// Create a new ratelimiter, that allows 5 requests per 60 seconds
export const commentRateLimiter = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per 60 seconds
      analytics: true, // Enable analytics
      prefix: "@upstash/ratelimit_comments", // Optional: prefix for your keys
    })
  : null

/**
 * Checks if a user is rate-limited for a specific action.
 * @param identifier Usually the user ID.
 * @returns True if the action is allowed, false if rate-limited.
 */
export async function checkRateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
  if (!commentRateLimiter) {
    // If Upstash is not configured, allow all requests (or handle as an error)
    console.warn("Rate limiter not initialized. Allowing request.")
    return { success: true, remaining: Number.POSITIVE_INFINITY } // Effectively no limit
  }
  try {
    const { success, limit, remaining, reset } = await commentRateLimiter.limit(identifier)
    return { success, remaining }
  } catch (error) {
    console.error("Error checking rate limit:", error)
    // Fallback: allow request if there's an error with the rate limiter itself
    return { success: true, remaining: Number.POSITIVE_INFINITY }
  }
}
