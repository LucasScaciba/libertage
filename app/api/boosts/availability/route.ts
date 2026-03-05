import { NextResponse } from "next/server";
import { BoostService } from "@/lib/services/boost.service";
import { createClient } from "@/lib/supabase/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";

/**
 * GET /api/boosts/availability - Check boost slot availability (authenticated, rate limited)
 * Rate limit: 30 requests per minute per user
 * Validates: Requirements 15.4, 15.7, 22.3, 22.4, 22.5
 */
export async function GET(request: Request) {
  try {
    // Apply rate limiting: 30 requests per minute per user
    const userId = await RateLimiter.getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const rateLimitKey = `boost_availability:${userId}`;
    const rateLimitConfig = {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
      keyGenerator: () => rateLimitKey,
    };

    const rateLimitResult = await RateLimiter.checkLimit(
      rateLimitKey,
      rateLimitConfig
    );

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetAt.getTime() - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    // Increment counter
    await RateLimiter.incrementCounter(rateLimitKey, rateLimitConfig);

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");
    const startTime = searchParams.get("startTime");

    if (!profileId || !startTime) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    // Check if profile already has a boost in the same time window or within 1 hour
    const oneHourBefore = new Date(start.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(end.getTime() + 60 * 60 * 1000);

    const { data: existingBoosts } = await supabase
      .from("boosts")
      .select("*")
      .eq("profile_id", profileId)
      .in("status", ["scheduled", "active"])
      .or(
        `and(start_time.lte.${oneHourAfter.toISOString()},end_time.gte.${oneHourBefore.toISOString()})`
      );

    if (existingBoosts && existingBoosts.length > 0) {
      return NextResponse.json(
        {
          available: false,
          error: "PROFILE_CONFLICT",
          message: "Você já possui um boost agendado neste período. Deve haver pelo menos 1 hora de diferença entre boosts.",
        },
        {
          status: 400,
          headers: {
            "X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    const context = BoostService.getBoostContext(profile as any);
    const isAvailable = await BoostService.checkAvailability(context, start, end);

    if (isAvailable) {
      return NextResponse.json(
        {
          available: true,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
        {
          headers: {
            "X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    // Get next available slots
    const nextSlots = await BoostService.getNextAvailableSlots(context, start);

    return NextResponse.json(
      {
        available: false,
        nextAvailableSlots: nextSlots.map((slot) => ({
          startTime: slot.toISOString(),
          endTime: new Date(slot.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        })),
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
        },
      }
    );
  } catch (error: any) {
    console.error("Error checking boost availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
