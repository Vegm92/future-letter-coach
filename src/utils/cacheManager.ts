import type { CachedItem } from '@/types/database';

export class CacheManager<T> {
  private cache = new Map<string, CachedItem<T>>();
  
  set(key: string, data: T, expirationHours: number = 1): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expirationHours
    });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    const isExpired = Date.now() - item.timestamp > item.expirationHours * 60 * 60 * 1000;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
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
  getStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    
    for (const [, item] of this.cache) {
      const isExpired = now - item.timestamp > item.expirationHours * 60 * 60 * 1000;
      if (isExpired) {
        expiredCount++;
      } else {
        validCount++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount
    };
  }
}