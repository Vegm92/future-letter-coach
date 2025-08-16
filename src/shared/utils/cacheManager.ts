import type { CacheEntry, CacheOptions } from '@/shared/types/services';

// Default cache options
const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum number of cache entries
};

// Cache statistics
export interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  averageAge: number;
  oldestItem: number;
  newestItem: number;
  memoryUsage: number;
}

// Cache event types
export interface CacheEvent<T> {
  type: 'set' | 'get' | 'delete' | 'clear' | 'expire';
  key: string;
  value?: T;
  timestamp: number;
}

// Cache event listener
export type CacheEventListener<T> = (event: CacheEvent<T>) => void;

// Generic cache manager class
export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>>;
  private options: Required<CacheOptions>;
  private eventListeners: Set<CacheEventListener<T>>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.cache = new Map();
    this.eventListeners = new Set();
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  // Set a value in cache
  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
    };

    // Check if we need to evict old entries
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.emitEvent('set', key, value);
  }

  // Get a value from cache
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.emitEvent('expire', key);
      return null;
    }

    // Update access time for LRU behavior
    entry.timestamp = Date.now();
    this.emitEvent('get', key, entry.data);
    
    return entry.data;
  }

  // Check if a key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // Delete a value from cache
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.emitEvent('delete', key, entry.data);
    return true;
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
    this.emitEvent('clear', '');
  }

  // Get cache size
  size(): number {
    this.cleanup(); // Clean up expired entries first
    return this.cache.size;
  }

  // Get all valid cache keys
  keys(): string[] {
    this.cleanup();
    return Array.from(this.cache.keys());
  }

  // Get cache statistics
  getStats(): CacheStats {
    this.cleanup();
    
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    if (entries.length === 0) {
      return {
        total: 0,
        valid: 0,
        expired: 0,
        averageAge: 0,
        oldestItem: 0,
        newestItem: 0,
        memoryUsage: 0,
      };
    }

    const ages = entries.map(entry => now - entry.timestamp);
    const totalAge = ages.reduce((sum, age) => sum + age, 0);
    
    return {
      total: entries.length,
      valid: entries.length,
      expired: 0,
      averageAge: totalAge / entries.length,
      oldestItem: Math.max(...ages),
      newestItem: Math.min(...ages),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  // Get cache entry details
  getEntry(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      return null;
    }
    return entry;
  }

  // Update TTL for an existing entry
  updateTTL(key: string, newTTL: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = newTTL;
    return true;
  }

  // Extend TTL for an existing entry
  extendTTL(key: string, additionalTTL: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl += additionalTTL;
    return true;
  }

  // Touch an entry (update timestamp without changing TTL)
  touch(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) return false;

    entry.timestamp = Date.now();
    return true;
  }

  // Get multiple values at once
  getMultiple(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    
    for (const key of keys) {
      result[key] = this.get(key);
    }
    
    return result;
  }

  // Set multiple values at once
  setMultiple(entries: Record<string, T>, ttl?: number): void {
    for (const [key, value] of Object.entries(entries)) {
      this.set(key, value, ttl);
    }
  }

  // Delete multiple keys at once
  deleteMultiple(keys: string[]): number {
    let deletedCount = 0;
    
    for (const key of keys) {
      if (this.delete(key)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  // Find keys by pattern (simple string matching)
  findKeys(pattern: string): string[] {
    this.cleanup();
    
    return this.keys().filter(key => 
      key.includes(pattern) || 
      key.startsWith(pattern) || 
      key.endsWith(pattern)
    );
  }

  // Find keys by predicate function
  findKeysByPredicate(predicate: (key: string, entry: CacheEntry<T>) => boolean): string[] {
    this.cleanup();
    
    const result: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry) && predicate(key, entry)) {
        result.push(key);
      }
    }
    
    return result;
  }

  // Add event listener
  addEventListener(listener: CacheEventListener<T>): void {
    this.eventListeners.add(listener);
  }

  // Remove event listener
  removeEventListener(listener: CacheEventListener<T>): void {
    this.eventListeners.delete(listener);
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.emitEvent('expire', key, entry.data);
      }
    });
  }

  // Destroy cache manager and cleanup resources
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.cache.clear();
    this.eventListeners.clear();
  }

  // Private methods
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, Math.min(this.options.ttl / 2, 60000)); // Clean up at least every minute
  }

  private emitEvent(type: CacheEvent<T>['type'], key: string, value?: T): void {
    const event: CacheEvent<T> = {
      type,
      key,
      value,
      timestamp: Date.now(),
    };

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Cache event listener error:', error);
      }
    });
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Estimate size of key and value
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 24; // Timestamp and TTL (8 bytes each) + object overhead
    }
    
    return totalSize;
  }
}

// Cache manager factory
export function createCacheManager<T>(options?: CacheOptions): CacheManager<T> {
  return new CacheManager<T>(options);
}

// Default cache manager instance
export const defaultCache = new CacheManager();

// Utility functions
export function isCacheEntry<T>(obj: unknown): obj is CacheEntry<T> {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'data' in obj &&
    'timestamp' in obj &&
    'ttl' in obj &&
    typeof (obj as CacheEntry<T>).timestamp === 'number' &&
    typeof (obj as CacheEntry<T>).ttl === 'number'
  );
}

export function createCacheEntry<T>(
  data: T,
  ttl: number = DEFAULT_OPTIONS.ttl
): CacheEntry<T> {
  return {
    data,
    timestamp: Date.now(),
    ttl,
  };
}

export function isExpired<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp > entry.ttl;
}

export function getRemainingTTL<T>(entry: CacheEntry<T>): number {
  const elapsed = Date.now() - entry.timestamp;
  return Math.max(0, entry.ttl - elapsed);
}
