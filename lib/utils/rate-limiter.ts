import { createClient } from "@/lib/supabase/server";

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests allowed
  windowMs: number; // Time window in milliseconds
  keyGenerator: (req: Request) => string | Promise<string>; // Function to generate unique key
}

/**
 * Rate limiting result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Database-backed rate limiter using Supabase
 * For production, consider using Redis for better performance
 * 
 * Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5
 */
export class RateLimiter {
  /**
   * Check if a request is within rate limits
   * 
   * @param key - Unique identifier for the rate limit (e.g., IP address, user ID, fingerprint)
   * @param config - Rate limit configuration
   * @returns Rate limit result with allowed status and remaining requests
   */
  static async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const supabase = await createClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Create rate_limits table if it doesn't exist (handled by migration)
    // Query for requests within the time window
    const { data, error } = await supabase
      .from("rate_limits")
      .select("id, created_at")
      .eq("key", key)
      .gte("created_at", windowStart.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Rate limit check error:", error);
      // Fail open - allow request if database error
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }

    const requestCount = data?.length || 0;
    const allowed = requestCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - requestCount);

    // Calculate reset time (oldest request + window)
    const resetAt =
      data && data.length > 0
        ? new Date(
            new Date(data[data.length - 1].created_at).getTime() +
              config.windowMs
          )
        : new Date(now.getTime() + config.windowMs);

    return {
      allowed,
      remaining,
      resetAt,
    };
  }

  /**
   * Increment the request counter for a key
   * Should be called after checkLimit returns allowed: true
   * 
   * @param key - Unique identifier for the rate limit
   * @param config - Rate limit configuration
   */
  static async incrementCounter(
    key: string,
    config: RateLimitConfig
  ): Promise<void> {
    const supabase = await createClient();

    // Insert new request record
    const { error } = await supabase.from("rate_limits").insert({
      key,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Rate limit increment error:", error);
    }

    // Clean up old records (optional, can be done by cron job)
    const windowStart = new Date(Date.now() - config.windowMs * 2); // Keep 2x window for safety
    await supabase
      .from("rate_limits")
      .delete()
      .eq("key", key)
      .lt("created_at", windowStart.toISOString());
  }

  /**
   * Get remaining requests for a key
   * 
   * @param key - Unique identifier for the rate limit
   * @param config - Rate limit configuration
   * @returns Number of remaining requests
   */
  static async getRemainingRequests(
    key: string,
    config: RateLimitConfig
  ): Promise<number> {
    const result = await this.checkLimit(key, config);
    return result.remaining;
  }

  /**
   * Helper to extract IP address from request
   */
  static getIpAddress(request: Request): string {
    // Check common headers for IP address
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
      return realIp;
    }

    // Fallback to a default (should not happen in production)
    return "unknown";
  }

  /**
   * Helper to extract user ID from authenticated request
   */
  static async getUserId(request: Request): Promise<string | null> {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id || null;
    } catch {
      return null;
    }
  }
}
