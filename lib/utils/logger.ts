/**
 * Structured logging utility for error tracking and debugging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isDebugEnabled = process.env.DEBUG === 'true';

  /**
   * Log a debug message (only in development or when DEBUG=true)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment || this.isDebugEnabled) {
      console.debug(this.formatLog('debug', message, context));
    }
  }

  /**
   * Log an informational message
   */
  info(message: string, context?: LogContext): void {
    console.info(this.formatLog('info', message, context));
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }

  /**
   * Log an error message with stack trace
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };

    console.error(this.formatLog('error', message, errorContext));

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { contexts: { custom: context } });
  }

  /**
   * Format log entry as structured JSON
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    return JSON.stringify(logEntry);
  }
}

export const logger = new Logger();
