# Rate Limiting Implementation

## Overview

This implementation provides database-backed rate limiting for the premium service marketplace application. It validates Requirements 22.1, 22.2, 22.3, 22.4, and 22.5.

## Architecture

### Database-Backed Storage
- Uses Supabase PostgreSQL for storing rate limit records
- Table: `rate_limits` with columns: `id`, `key`, `created_at`
- Indexed on `(key, created_at)` for efficient lookups
- **Note**: For production, consider migrating to Redis for better performance

### RateLimiter Utility
Location: `lib/utils/rate-limiter.ts`

Key methods:
- `checkLimit(key, config)`: Check if request is within limits
- `incrementCounter(key, config)`: Record a new request
- `getRemainingRequests(key, config)`: Get remaining request count
- `getIpAddress(request)`: Extract IP from request headers
- `getUserId(request)`: Extract authenticated user ID

## Rate Limits Applied

### 1. Catalog Search (GET /api/catalog)
- **Limit**: 60 requests per minute per IP address
- **Key**: `catalog:{ip}`
- **Validates**: Requirements 22.1, 22.4, 22.5
- **Response Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in window
  - `X-RateLimit-Reset`: When the limit resets (ISO 8601)
  - `Retry-After`: Seconds until retry (on 429 response)

### 2. Report Submission (POST /api/reports)
- **Limit**: 5 requests per hour per fingerprint
- **Key**: `report:{fingerprint}`
- **Validates**: Requirements 17.6, 22.2, 22.4, 22.5
- **Implementation**: Already implemented in ReportService
- **Response**: 429 with `Retry-After: 3600` header

### 3. Boost Availability Check (GET /api/boosts/availability)
- **Limit**: 30 requests per minute per authenticated user
- **Key**: `boost_availability:{userId}`
- **Validates**: Requirements 22.3, 22.4, 22.5
- **Requires**: Authentication (returns 401 if not authenticated)
- **Response Headers**: Same as catalog endpoint

## Error Response Format

When rate limit is exceeded (429 Too Many Requests):

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

Headers:
- `Retry-After`: Seconds until the rate limit resets
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: 0
- `X-RateLimit-Reset`: ISO 8601 timestamp when limit resets

## Database Migration

Migration file: `supabase/migrations/004_rate_limits.sql`

Creates:
- `rate_limits` table
- Index on `(key, created_at DESC)` for efficient queries

## Configuration

Rate limit configurations are defined inline in each API route:

```typescript
const rateLimitConfig = {
  maxRequests: 60,           // Maximum requests allowed
  windowMs: 60 * 1000,       // Time window in milliseconds
  keyGenerator: () => key,   // Function to generate unique key
};
```

## Testing

Unit tests: `lib/utils/__tests__/rate-limiter.test.ts`

Tests cover:
- IP address extraction from headers
- Rate limit configuration structure
- Key generation logic
- All three rate limit configurations

## Performance Considerations

### Current Implementation (Database)
- **Pros**: Simple, no additional infrastructure
- **Cons**: Database queries on every request
- **Suitable for**: MVP and low-to-medium traffic

### Production Recommendation (Redis)
- **Pros**: In-memory, extremely fast, built-in TTL
- **Cons**: Additional infrastructure
- **Migration**: Replace Supabase queries with Redis commands
  - `checkLimit` → `GET` + `TTL`
  - `incrementCounter` → `INCR` + `EXPIRE`

Example Redis implementation:
```typescript
// Check limit
const count = await redis.get(key);
if (count >= maxRequests) return { allowed: false };

// Increment
await redis.incr(key);
await redis.expire(key, windowSeconds);
```

## Cleanup

The current implementation includes automatic cleanup:
- Old records (2x window age) are deleted during `incrementCounter`
- Alternative: Set up a cron job to periodically clean old records

## Monitoring

Consider adding:
- Metrics for rate limit hits per endpoint
- Alerts for unusual rate limit patterns
- Dashboard showing rate limit usage by IP/user

## Future Enhancements

1. **Distributed Rate Limiting**: For multi-region deployments
2. **Dynamic Limits**: Adjust limits based on user tier or time of day
3. **Whitelist/Blacklist**: Bypass or block specific IPs
4. **Burst Allowance**: Allow short bursts above the limit
5. **Cost-Based Limiting**: Different costs for different operations
