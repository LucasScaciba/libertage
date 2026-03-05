import { CatalogService } from "@/lib/services/catalog.service";
import { NextResponse } from "next/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";

/**
 * GET /api/catalog - Search and filter catalog (public, rate limited)
 * Rate limit: 60 requests per minute per IP
 * Validates: Requirements 9.1, 9.2, 9.3, 9.5, 22.1, 22.4, 22.5
 */
export async function GET(request: Request) {
  try {
    // Apply rate limiting: 60 requests per minute per IP
    const ip = RateLimiter.getIpAddress(request);
    const rateLimitKey = `catalog:${ip}`;
    const rateLimitConfig = {
      maxRequests: 60,
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

    // Parse filters
    const filters = {
      search: searchParams.get("search") || undefined,
      gender: searchParams.get("gender") || undefined,
      service: searchParams.get("service") || undefined,
      city: searchParams.get("city") || undefined,
      region: searchParams.get("region") || undefined,
      features: searchParams.get("features")?.split(",") || undefined,
    };

    // Parse pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // Get catalog results
    const result = await CatalogService.searchCatalog(filters, page, pageSize);

    // Get available filters (cities, categories, regions)
    const cities = await CatalogService.getCities();
    const categories = await CatalogService.getCategories();
    const regions = await CatalogService.getRegions();

    return NextResponse.json({
      ...result,
      filters: {
        cities,
        categories,
        regions,
      },
    }, {
      headers: {
        "X-RateLimit-Limit": rateLimitConfig.maxRequests.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}
