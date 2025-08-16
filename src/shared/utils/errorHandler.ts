import type { ErrorContext, ErrorReport } from "@/shared/types/services";

// Error types
export interface AppError extends Error {
  code?: string;
  context?: ErrorContext;
  isAppError?: boolean;
}

export interface ErrorHandlerOptions {
  logToConsole?: boolean;
  logToService?: boolean;
  showUserMessage?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

// Default error handler options
const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  logToConsole: true,
  logToService: false,
  showUserMessage: true,
  retryAttempts: 0,
  retryDelay: 1000,
};

// Error handler class
export class ErrorHandler {
  private options: ErrorHandlerOptions;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;

  constructor(options: Partial<ErrorHandlerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Handle errors with context
  handleError(
    error: Error | string,
    context: ErrorContext = {},
    options: Partial<ErrorHandlerOptions> = {}
  ): void {
    const mergedOptions = { ...this.options, ...options };
    const appError = this.normalizeError(error, context);

    // Log error
    if (mergedOptions.logToConsole) {
      this.logError(appError);
    }

    // Queue for service logging
    if (mergedOptions.logToService) {
      this.queueError(appError);
    }

    // Show user message if needed
    if (mergedOptions.showUserMessage) {
      this.showUserMessage(appError);
    }
  }

  // Handle async operations with error handling
  async handleAsync<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {},
    options: Partial<ErrorHandlerOptions> = {}
  ): Promise<T | null> {
    const mergedOptions = { ...this.options, ...options };

    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context, mergedOptions);
      return null;
    }
  }

  // Handle async operations with retry logic
  async handleAsyncWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {},
    options: Partial<ErrorHandlerOptions> = {}
  ): Promise<T | null> {
    const mergedOptions = { ...this.options, ...options };
    const retryAttempts = mergedOptions.retryAttempts || 0;
    const retryDelay = mergedOptions.retryDelay || 1000;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retryAttempts) {
          this.handleError(error, context, mergedOptions);
          return null;
        }

        // Wait before retrying
        await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    return null;
  }

  // Handle form validation errors
  handleValidationError(
    errors: Record<string, string[]>,
    context: ErrorContext = {}
  ): void {
    const errorMessage = Object.entries(errors)
      .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(", ")}`)
      .join("; ");

    const validationError = new Error(`Validation failed: ${errorMessage}`);
    this.handleError(validationError, {
      ...context,
      action: "validation",
    });
  }

  // Handle API errors
  handleApiError(
    status: number,
    message: string,
    context: ErrorContext = {}
  ): void {
    const apiError = new Error(`API Error ${status}: ${message}`);
    (apiError as AppError).code = `API_${status}`;

    this.handleError(apiError, {
      ...context,
      action: "api_call",
    });
  }

  // Handle network errors
  handleNetworkError(error: Error, context: ErrorContext = {}): void {
    const networkError = new Error(`Network Error: ${error.message}`);
    (networkError as AppError).code = "NETWORK_ERROR";

    this.handleError(networkError, {
      ...context,
      action: "network_request",
    });
  }

  // Handle authentication errors
  handleAuthError(error: Error, context: ErrorContext = {}): void {
    const authError = new Error(`Authentication Error: ${error.message}`);
    (authError as AppError).code = "AUTH_ERROR";

    this.handleError(authError, {
      ...context,
      action: "authentication",
    });
  }

  // Handle permission errors
  handlePermissionError(error: Error, context: ErrorContext = {}): void {
    const permissionError = new Error(`Permission Error: ${error.message}`);
    (permissionError as AppError).code = "PERMISSION_ERROR";

    this.handleError(permissionError, {
      ...context,
      action: "permission_check",
    });
  }

  // Get error summary for reporting
  getErrorSummary(): {
    totalErrors: number;
    errorTypes: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const errorTypes: Record<string, number> = {};
    const recentErrors = this.errorQueue.slice(-10); // Last 10 errors

    this.errorQueue.forEach((report) => {
      const errorType = report.error.constructor.name;
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });

    return {
      totalErrors: this.errorQueue.length,
      errorTypes,
      recentErrors,
    };
  }

  // Clear error queue
  clearErrorQueue(): void {
    this.errorQueue = [];
  }

  // Private methods
  private normalizeError(
    error: Error | string,
    context: ErrorContext
  ): AppError {
    if (typeof error === "string") {
      const appError = new Error(error) as AppError;
      appError.isAppError = true;
      appError.context = context;
      return appError;
    }

    if ((error as AppError).isAppError) {
      return error as AppError;
    }

    const appError = error as AppError;
    appError.isAppError = true;
    appError.context = context;
    return appError;
  }

  private logError(error: AppError): void {
    const timestamp = new Date().toISOString();
    const context = error.context || {};

    console.error(`[${timestamp}] Error:`, {
      message: error.message,
      code: error.code,
      stack: error.stack,
      context,
    });
  }

  private queueError(error: AppError): void {
    const errorReport: ErrorReport = {
      error,
      context: error.context || {},
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    this.errorQueue.push(errorReport);

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processErrorQueue();
    }
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process errors in batches
      const batch = this.errorQueue.splice(0, 10);

      for (const report of batch) {
        await this.sendErrorToService(report);
      }
    } catch (error) {
      console.error("Failed to process error queue:", error);
    } finally {
      this.isProcessing = false;

      // Process remaining errors if any
      if (this.errorQueue.length > 0) {
        setTimeout(() => this.processErrorQueue(), 1000);
      }
    }
  }

  private async sendErrorToService(report: ErrorReport): Promise<void> {
    try {
      // This would typically send to an error reporting service
      // For now, we'll just log it
      console.log("Sending error to service:", report);

      // Simulate API call
      await this.delay(100);
    } catch (error) {
      console.error("Failed to send error to service:", error);
    }
  }

  private showUserMessage(error: AppError): void {
    // This would typically show a toast notification
    // For now, we'll just log it
    console.log("Showing user message:", error.message);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Default error handler instance
export const errorHandler = new ErrorHandler();

// Utility functions for common error handling patterns
export function createError(
  message: string,
  code?: string,
  context?: ErrorContext
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.context = context;
  error.isAppError = true;
  return error;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && (error as AppError).isAppError === true;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

export function getErrorCode(error: unknown): string | undefined {
  if (isAppError(error)) {
    return error.code;
  }
  return undefined;
}

export function getErrorContext(error: unknown): ErrorContext | undefined {
  if (isAppError(error)) {
    return error.context;
  }
  return undefined;
}
