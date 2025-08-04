import type { CachedItem, CacheOptions, CacheStats } from '@/types';

/**
 * A generic cache manager with LRU eviction, flexible expiration times, and comprehensive statistics.
 * Supports time-based expiration, size limits, and provides debugging capabilities.
 * 
 * @template T The type of data being cached
 * 
 * @example
 * ```typescript
 * // Create cache with 50 item limit
 * const cache = new CacheManager<string>(50);
 * 
 * // Store with different time units
 * cache.set('key1', 'data', { expirationMinutes: 30 });
 * cache.set('key2', 'data', { expirationHours: 2 });
 * cache.set('key3', 'data', { expirationMs: 5000 });
 * 
 * // Retrieve data
 * const data = cache.get('key1');
 * 
 * // Check statistics
 * const stats = cache.getStats();
 * console.log(`Cache utilization: ${cache.getUtilization().utilizationPercent}%`);
 * ```
 */
export class CacheManager<T> {
  private cache = new Map<string, CachedItem<T>>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private accessCounter = 0;
  
  /**
   * Creates a new CacheManager instance.
   * 
   * @param maxSize Maximum number of items to store. When exceeded, least recently used items are evicted.
   * @default 100
   */
  constructor(private maxSize: number = 100) {}
  
  /**
   * Stores data in the cache with configurable expiration time.
   * Supports multiple time units and maintains backward compatibility.
   * 
   * @param key Unique identifier for the cached item. Must be a non-empty string.
   * @param data The data to cache
   * @param options Expiration configuration or backward-compatible number (hours)
   * 
   * @throws {Error} If key is invalid or expiration time is not positive
   * 
   * @example
   * ```typescript
   * // Different ways to set expiration
   * cache.set('key1', data, { expirationMinutes: 30 });
   * cache.set('key2', data, { expirationHours: 2 });
   * cache.set('key3', data, { expirationMs: 5000 });
   * cache.set('key4', data, 1); // Backward compatible: 1 hour
   * ```
   */
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
  
  /**
   * Retrieves data from the cache if it exists and hasn't expired.
   * Updates access statistics for LRU tracking.
   * 
   * @param key The key to retrieve
   * @returns The cached data or null if not found/expired
   * 
   * @example
   * ```typescript
   * const data = cache.get('myKey');
   * if (data !== null) {
   *   console.log('Cache hit:', data);
   * } else {
   *   console.log('Cache miss or expired');
   * }
   * ```
   */
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
  
  /**
   * Checks if a key exists in the cache and hasn't expired.
   * This is a pure function - it doesn't modify cache state or access statistics.
   * 
   * @param key The key to check
   * @returns true if the key exists and is not expired, false otherwise
   * 
   * @example
   * ```typescript
   * if (cache.has('myKey')) {
   *   const data = cache.get('myKey'); // Guaranteed to return data
   * }
   * ```
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const isExpired = Date.now() - item.timestamp > item.expirationMs;
    return !isExpired; // Pure check - no side effects
  }
  
  /**
   * Removes all items from the cache.
   * 
   * @example
   * ```typescript
   * cache.clear();
   * console.log(cache.getStats().total); // 0
   * ```
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }
  
  /**
   * Removes a specific item from the cache.
   * 
   * @param key The key to remove
   * @returns true if the item was removed, false if it didn't exist
   * 
   * @example
   * ```typescript
   * const wasRemoved = cache.delete('myKey');
   * console.log(wasRemoved ? 'Removed' : 'Not found');
   * ```
   */
  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }
  
  /**
   * Manually removes all expired items from the cache.
   * Useful for preventing memory leaks in long-running applications.
   * 
   * @returns The number of items that were removed
   * 
   * @example
   * ```typescript
   * const removedCount = cache.purgeExpired();
   * console.log(`Cleaned up ${removedCount} expired items`);
   * ```
   */
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
  
  /**
   * Evicts the least recently used item from the cache.
   * Called automatically when maxSize is reached.
   * 
   * @private
   */
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
  
  /**
   * Gets all non-expired keys from the cache.
   * 
   * @returns Array of valid cache keys
   * 
   * @example
   * ```typescript
   * const keys = cache.getKeys();
   * console.log(`Cache contains keys: ${keys.join(', ')}`);
   * ```
   */
  getKeys(): string[] {
    const validKeys: string[] = [];
    
    for (const [key] of this.cache) {
      if (this.has(key)) { // This also checks expiration
        validKeys.push(key);
      }
    }
    
    return validKeys;
  }
  
  /**
   * Gets comprehensive statistics about the cache state.
   * 
   * @returns Detailed cache statistics including counts, timing, and memory usage
   * 
   * @example
   * ```typescript
   * const stats = cache.getStats();
   * console.log(`Cache efficiency: ${(stats.valid / stats.total * 100).toFixed(1)}%`);
   * console.log(`Average item age: ${(stats.averageAge / 1000).toFixed(1)}s`);
   * ```
   */
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
  
  /**
   * Gets cache utilization and capacity information.
   * 
   * @returns Current size, limits, and utilization percentage
   * 
   * @example
   * ```typescript
   * const util = cache.getUtilization();
   * if (util.utilizationPercent > 80) {
   *   console.warn('Cache is nearly full');
   * }
   * ```
   */
  getUtilization() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100),
      hasCapacity: this.cache.size < this.maxSize
    };
  }
  
  // ============= DEBUG METHODS =============
  
  /**
   * Gets detailed debug information about a specific cache item.
   * Useful for troubleshooting cache behavior.
   * 
   * @param key The key to inspect
   * @returns Debug information or null if key doesn't exist
   * 
   * @example
   * ```typescript
   * const debug = cache.debugItem('myKey');
   * if (debug) {
   *   console.log(`Item accessed ${debug.accessCount} times`);
   *   console.log(`Last accessed: ${new Date(debug.lastAccessed)}`);
   * }
   * ```
   */
  debugItem(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    const age = now - item.timestamp;
    const timeSinceLastAccess = now - item.lastAccessed;
    const isExpired = age > item.expirationMs;
    const timeUntilExpiration = isExpired ? 0 : item.expirationMs - age;
    
    return {
      key,
      exists: true,
      isExpired,
      age,
      timeSinceLastAccess,
      timeUntilExpiration,
      accessCount: item.accessCount,
      lastAccessed: item.lastAccessed,
      createdAt: item.timestamp,
      expirationMs: item.expirationMs,
      accessOrder: this.accessOrder.get(key) || 0,
      data: item.data
    };
  }
  
  /**
   * Gets debug information for all cache items.
   * Useful for understanding cache patterns and performance.
   * 
   * @returns Array of debug information for all items
   * 
   * @example
   * ```typescript
   * const allItems = cache.debugAll();
   * const mostAccessed = allItems.sort((a, b) => b.accessCount - a.accessCount)[0];
   * console.log(`Most accessed item: ${mostAccessed.key}`);
   * ```
   */
  debugAll() {
    return Array.from(this.cache.keys()).map(key => this.debugItem(key)).filter(Boolean);
  }
  
  /**
   * Logs a comprehensive cache report to the console.
   * Useful for debugging and monitoring cache performance.
   * 
   * @param includeItems Whether to include individual item details
   * 
   * @example
   * ```typescript
   * cache.debugReport(); // Basic statistics
   * cache.debugReport(true); // Include all item details
   * ```
   */
  debugReport(includeItems: boolean = false): void {
    const stats = this.getStats();
    const util = this.getUtilization();
    
    console.group('🗄️ Cache Debug Report');
    console.log('📊 Statistics:', stats);
    console.log('📈 Utilization:', util);
    
    if (includeItems) {
      console.log('📝 Items:');
      const items = this.debugAll();
      items.forEach(item => {
        console.log(`  ${item.key}:`, {
          age: `${(item.age / 1000).toFixed(1)}s`,
          accessCount: item.accessCount,
          isExpired: item.isExpired,
          timeUntilExpiration: item.isExpired ? 'expired' : `${(item.timeUntilExpiration / 1000).toFixed(1)}s`
        });
      });
    }
    
    console.groupEnd();
  }
  
  /**
   * Validates cache integrity and reports any issues.
   * Useful for detecting bugs or inconsistencies in cache state.
   * 
   * @returns Validation report with any issues found
   * 
   * @example
   * ```typescript
   * const validation = cache.validateIntegrity();
   * if (!validation.isValid) {
   *   console.error('Cache integrity issues:', validation.issues);
   * }
   * ```
   */
  validateIntegrity() {
    const issues: string[] = [];
    
    // Check if accessOrder and cache are in sync
    if (this.cache.size !== this.accessOrder.size) {
      issues.push(`Size mismatch: cache has ${this.cache.size} items, accessOrder has ${this.accessOrder.size}`);
    }
    
    // Check for orphaned access order entries
    for (const key of this.accessOrder.keys()) {
      if (!this.cache.has(key)) {
        issues.push(`Orphaned access order entry: ${key}`);
      }
    }
    
    // Check for missing access order entries
    for (const key of this.cache.keys()) {
      if (!this.accessOrder.has(key)) {
        issues.push(`Missing access order entry: ${key}`);
      }
    }
    
    // Check for invalid timestamps
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (item.timestamp > now) {
        issues.push(`Future timestamp for key ${key}: ${item.timestamp}`);
      }
      if (item.lastAccessed > now) {
        issues.push(`Future lastAccessed for key ${key}: ${item.lastAccessed}`);
      }
      if (item.expirationMs <= 0) {
        issues.push(`Invalid expiration for key ${key}: ${item.expirationMs}`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      timestamp: now
    };
  }
}