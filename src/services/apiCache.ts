/**
 * High-performance client-side in-memory cache for instant navigation (SWR pattern)
 * Eliminates blank loading spinners on tab switching and delivers sub-millisecond response times.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  // Return cached data immediately if available (even if revalidating in background)
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? (entry.data as T) : null;
  }

  // Check if cache entry is still fresh (within TTL)
  isFresh(key: string, ttlMs = 45000): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < ttlMs;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Invalidate cache for specific keys or matching prefixes (e.g. after add/update/delete)
  invalidate(keyOrPrefix: string): void {
    for (const key of this.cache.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new ApiCacheManager();
