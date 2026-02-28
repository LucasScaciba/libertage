/**
 * Simple in-memory cache with TTL support
 * For production, consider using Redis or similar
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache with TTL in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  /**
   * Stop cleanup interval (for testing)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const cache = new Cache();

/**
 * Cache wrapper for async functions
 * 
 * @param key - Cache key
 * @param fn - Function to execute if cache miss
 * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
 * @returns Cached or fresh value
 * 
 * @example
 * const categories = await withCache(
 *   'catalog:categories',
 *   async () => await fetchCategories(),
 *   300 // 5 minutes
 * );
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const value = await fn();
  cache.set(key, value, ttlSeconds);
  return value;
}

/**
 * Invalidate cache entries by pattern
 * 
 * @param pattern - Regex pattern to match keys
 * 
 * @example
 * invalidateCache(/^catalog:/); // Invalidate all catalog cache
 */
export function invalidateCache(pattern: RegExp): void {
  const stats = cache.getStats();
  for (const key of stats.keys) {
    if (pattern.test(key)) {
      cache.delete(key);
    }
  }
}
