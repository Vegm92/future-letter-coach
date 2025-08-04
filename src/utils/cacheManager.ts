import type { CachedItem, CacheOptions, CacheStats } from '@/types';

export class CacheManager<T> {
  private cache = new Map<string, CachedItem<T>>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private accessCounter = 0;
  
  constructor(private maxSize: number = 100) {}
  
  set(key: string, data: T, options: CacheOptions | number = {}): void {
    // Handle backward compatibility - if number is passed, treat as expirationHours
    const opts = typeof options === 'number' ? { expirationHours: options } : options;
    
    // Calculate expiration in milliseconds
    let expirationMs = 60 * 60 * 1000; // Default 1 hour
    if (opts.expirationMs) expirationMs = opts.expirationMs;
    else if (opts.expirationSeconds) expirationMs = opts.expirationSeconds * 1000;
    else if (opts.expirationMinutes) expirationMs = opts.expirationMinutes * 60 * 1000;
    else if (opts.expirationHours) expirationMs = opts.expirationHours * 60 * 60 * 1000;
    
    // Input validation
    if (expirationMs <= 0) {
      throw new Error('Expiration time must be positive');
    }
    if (typeof key !== 'string' || key.trim() === '') {
      throw new Error('Key must be a non-empty string');
    }
    
    // Check if we need to evict items due to size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }
    
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expirationMs,
      accessCount: 1,
      lastAccessed: now
    });
    
    // Update access order for LRU
    this.accessOrder.set(key, ++this.accessCounter);
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    const now = Date.now();
    const isExpired = now - item.timestamp > item.expirationMs;
    
    if (isExpired) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }
    
    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;
    this.accessOrder.set(key, ++this.accessCounter);
    
    return item.data;
  }
  
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const isExpired = Date.now() - item.timestamp > item.expirationMs;
    return !isExpired; // Pure check - no side effects
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }
  
  // Manual cleanup of expired items to prevent memory leaks
  purgeExpired(): number {
    const now = Date.now();
    let purgedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      const isExpired = now - item.timestamp > item.expirationMs;
      if (isExpired) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        purgedCount++;
      }
    }
    
    return purgedCount;
  }
  
  // LRU eviction - remove least recently used item
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;
    
    let lruKey = '';
    let lruOrder = Infinity;
    
    for (const [key] of this.cache) {
      const order = this.accessOrder.get(key) || 0;
      if (order < lruOrder) {
        lruOrder = order;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
      this.accessOrder.delete(lruKey);
    }
  }
  
  // Get all non-expired keys
  getKeys(): string[] {
    const validKeys: string[] = [];
    
    for (const [key] of this.cache) {
      if (this.has(key)) { // This also checks expiration
        validKeys.push(key);
      }
    }
    
    return validKeys;
  }
  
  // Get cache statistics
  getStats(): CacheStats {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    let totalAge = 0;
    let oldestTime = now;
    let newestTime = 0;
    
    for (const [, item] of this.cache) {
      const isExpired = now - item.timestamp > item.expirationMs;
      const age = now - item.timestamp;
      
      if (isExpired) {
        expiredCount++;
      } else {
        validCount++;
        totalAge += age;
        oldestTime = Math.min(oldestTime, item.timestamp);
        newestTime = Math.max(newestTime, item.timestamp);
      }
    }
    
    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      averageAge: validCount > 0 ? Math.round(totalAge / validCount) : 0,
      oldestItem: validCount > 0 ? now - oldestTime : 0,
      newestItem: validCount > 0 ? now - newestTime : 0,
      memoryUsage: this.cache.size
    };
  }
  
  // Get cache utilization info
  getUtilization() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100),
      hasCapacity: this.cache.size < this.maxSize
    };
  }
}