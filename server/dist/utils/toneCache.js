"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toneCache = exports.ToneCache = void 0;
/**
 * Tiny in-memory LRU cache with per-entry TTL.
 * - Max size: 1000 entries
 * - LRU behavior: "touch" on get/set
 */
class ToneCache {
    maxEntries;
    map;
    constructor(maxEntries = 1000) {
        this.maxEntries = maxEntries;
        this.map = new Map();
    }
    get(key) {
        const entry = this.map.get(key);
        if (!entry)
            return undefined;
        if (Date.now() >= entry.expiresAt) {
            this.map.delete(key);
            return undefined;
        }
        // Touch for LRU
        this.map.delete(key);
        this.map.set(key, entry);
        return entry.value;
    }
    set(key, value, ttlMs) {
        const expiresAt = Date.now() + ttlMs;
        const entry = { value, expiresAt };
        if (this.map.has(key))
            this.map.delete(key);
        this.map.set(key, entry);
        // Evict LRU
        while (this.map.size > this.maxEntries) {
            const oldestKey = this.map.keys().next().value;
            if (!oldestKey)
                break;
            this.map.delete(oldestKey);
        }
    }
    clear() {
        this.map.clear();
    }
    size() {
        return this.map.size;
    }
}
exports.ToneCache = ToneCache;
// Singleton cache for tone analysis results
exports.toneCache = new ToneCache(1000);
//# sourceMappingURL=toneCache.js.map