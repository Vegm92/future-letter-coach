import { useToast } from "@/shared/hooks/use-toast";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  timestamp: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: Record<string, unknown>;
  duration?: number;
  status?: number;
  url?: string;
  method?: string;
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableStatuses: [408, 429, 500, 502, 503, 504],
      ...config,
    };
  }

  async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;

        if (attempt > 0) {
          this.log("info", `Retry successful on attempt ${attempt + 1}`, {
            context,
            attempt: attempt + 1,
            duration,
          });
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt >= this.config.maxAttempts) {
          this.log("error", `All retry attempts failed`, {
            context,
            attempts: attempt,
            error: lastError.message,
          });
          throw lastError;
        }

        const delay = this.calculateDelay(attempt);
        this.log(
          "warn",
          `Retry attempt ${attempt} failed, retrying in ${delay}ms`,
          {
            context,
            attempt,
            error: lastError.message,
            nextRetryIn: delay,
          }
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    const delay =
      this.config.baseDelay *
      Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(
    level: LogEntry["level"],
    message: string,
    context?: Record<string, unknown>
  ) {
    Logger.log(level, message, context);
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  canMakeRequest(identifier: string): boolean {
    const key = this.config.keyGenerator?.(identifier) ?? identifier;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requestTimes = this.requests.get(key)!;

    // Remove old requests outside the window
    const recentRequests = requestTimes.filter((time) => time > windowStart);
    this.requests.set(key, recentRequests);

    return recentRequests.length < this.config.maxRequests;
  }

  recordRequest(identifier: string): void {
    const key = this.config.keyGenerator?.(identifier) ?? identifier;
    const now = Date.now();

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    this.requests.get(key)!.push(now);
  }

  getRemainingRequests(identifier: string): number {
    const key = this.config.keyGenerator?.(identifier) ?? identifier;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (!this.requests.has(key)) {
      return this.config.maxRequests;
    }

    const requestTimes = this.requests.get(key)!;
    const recentRequests = requestTimes.filter((time) => time > windowStart);

    return Math.max(0, this.config.maxRequests - recentRequests.length);
  }

  getResetTime(identifier: string): number {
    const key = this.config.keyGenerator?.(identifier) ?? identifier;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (!this.requests.has(key)) {
      return now + this.config.windowMs;
    }

    const requestTimes = this.requests.get(key)!;
    const oldestRequest = Math.min(...requestTimes);

    return oldestRequest + this.config.windowMs;
  }

  clear(identifier?: string): void {
    if (identifier) {
      const key = this.config.keyGenerator?.(identifier) ?? identifier;
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// ============================================================================
// LOGGING
// ============================================================================

export class Logger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000;
  private static isDevelopment = process.env.NODE_ENV === "development";

  static log(
    level: LogEntry["level"],
    message: string,
    context?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging in development
    if (this.isDevelopment) {
      const logMethod =
        level === "error" ? "error" : level === "warn" ? "warn" : "log";
      console[logMethod](`[${level.toUpperCase()}] ${message}`, context || "");
    }

    // Send to external logging service in production (placeholder)
    if (level === "error" && !this.isDevelopment) {
      this.sendToLoggingService(entry);
    }
  }

  static getLogs(level?: LogEntry["level"], limit?: number): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  static clearLogs(): void {
    this.logs = [];
  }

  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private static async sendToLoggingService(entry: LogEntry): Promise<void> {
    // Placeholder for external logging service integration
    // This could send to Sentry, LogRocket, or similar services
    try {
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      console.error("Failed to send log to external service:", error);
    }
  }
}

// ============================================================================
// API CLIENT WITH RETRY & RATE LIMITING
// ============================================================================

export class ApiClient {
  private retryManager: RetryManager;
  private rateLimiter: RateLimiter;
  private baseURL: string;

  constructor(
    baseURL: string,
    retryConfig?: Partial<RetryConfig>,
    rateLimitConfig?: RateLimitConfig
  ) {
    this.baseURL = baseURL;
    this.retryManager = new RetryManager(retryConfig);
    this.rateLimiter = new RateLimiter(
      rateLimitConfig ?? {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
      }
    );
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    context?: string
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const identifier = options.method || "GET";

    // Check rate limiting
    if (!this.rateLimiter.canMakeRequest(identifier)) {
      const resetTime = this.rateLimiter.getResetTime(identifier);
      const waitTime = resetTime - Date.now();

      Logger.log("warn", "Rate limit exceeded", {
        context,
        endpoint,
        method: options.method,
        resetTime: new Date(resetTime).toISOString(),
        waitTime,
      });

      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(
          waitTime / 1000
        )} seconds.`
      );
    }

    // Record the request
    this.rateLimiter.recordRequest(identifier);

    return this.retryManager.execute(async () => {
      const startTime = Date.now();

      try {
        Logger.log("info", `Making API request`, {
          context,
          url,
          method: options.method || "GET",
        });

        const response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        const duration = Date.now() - startTime;
        const responseData = await this.parseResponse(response);

        Logger.log("info", `API request completed`, {
          context,
          url,
          method: options.method || "GET",
          status: response.status,
          duration,
        });

        return {
          success: response.ok,
          data: responseData,
          status: response.status,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        const duration = Date.now() - startTime;

        Logger.log("error", `API request failed`, {
          context,
          url,
          method: options.method || "GET",
          error: error instanceof Error ? error.message : "Unknown error",
          duration,
        });

        throw error;
      }
    }, context);
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      return response.json();
    }

    if (contentType?.includes("text/")) {
      return response.text();
    }

    return response.arrayBuffer();
  }

  // Convenience methods
  async get<T>(endpoint: string, context?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" }, context);
  }

  async post<T>(
    endpoint: string,
    data: unknown,
    context?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      context
    );
  }

  async put<T>(
    endpoint: string,
    data: unknown,
    context?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      context
    );
  }

  async delete<T>(endpoint: string, context?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" }, context);
  }

  async patch<T>(
    endpoint: string,
    data: unknown,
    context?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      context
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createApiClient(
  baseURL: string,
  retryConfig?: Partial<RetryConfig>,
  rateLimitConfig?: RateLimitConfig
): ApiClient {
  return new ApiClient(baseURL, retryConfig, rateLimitConfig);
}

export function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  context?: string
): Promise<T> {
  const retryManager = new RetryManager(config);
  return retryManager.execute(operation, context);
}

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

export function logApiCall(
  level: LogEntry["level"],
  message: string,
  context?: Record<string, unknown>
): void {
  Logger.log(level, message, context);
}

export function getApiLogs(
  level?: LogEntry["level"],
  limit?: number
): LogEntry[] {
  return Logger.getLogs(level, limit);
}

export function clearApiLogs(): void {
  Logger.clearLogs();
}

export function exportApiLogs(): string {
  return Logger.exportLogs();
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Response) {
    return [408, 429, 500, 502, 503, 504].includes(error.status);
  }

  if (error instanceof Error) {
    const retryableMessages = [
      "network error",
      "timeout",
      "connection refused",
      "service unavailable",
    ];

    return retryableMessages.some((msg) =>
      error.message.toLowerCase().includes(msg)
    );
  }

  return false;
}

export function createErrorResponse(
  error: unknown,
  context?: string
): ApiResponse<never> {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  Logger.log("error", `API error: ${errorMessage}`, {
    context,
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  };
}

export function handleApiError(
  error: unknown,
  context?: string,
  showToast = true
): void {
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";

  Logger.log("error", `Handling API error: ${errorMessage}`, {
    context,
    error: errorMessage,
  });

  if (showToast) {
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }
}
