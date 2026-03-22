export interface ToneCacheEntry<T> {
  value: T;
  expiresAt: number; // epoch ms
}

/**
 * Tiny in-memory LRU cache with per-entry TTL.
 * - Max size: 1000 entries
 * - LRU behavior: "touch" on get/set
 */
export class ToneCache<T> {
  private readonly maxEntries: number;
  private readonly map: Map<string, ToneCacheEntry<T>>;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
    this.map = new Map();
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // Touch for LRU
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    const entry: ToneCacheEntry<T> = { value, expiresAt };

    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, entry);

    // Evict LRU
    while (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.map.delete(oldestKey);
    }
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}

// Singleton cache for tone analysis results
export const toneCache = new ToneCache<unknown>(1000);

