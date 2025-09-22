// ---------------------------------------------------------------------------
// Structured logging utility for development and production
// ---------------------------------------------------------------------------

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatLog(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString()
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.shouldLog('debug')) {
      const entry = this.formatLog('debug', message, context, data);
      console.debug(`[${entry.timestamp}] [${entry.context || 'APP'}] ${entry.message}`, entry.data);
    }
  }

  info(message: string, context?: string, data?: any): void {
    if (this.shouldLog('info')) {
      const entry = this.formatLog('info', message, context, data);
      console.info(`[${entry.timestamp}] [${entry.context || 'APP'}] ${entry.message}`, entry.data);
    }
  }

  warn(message: string, context?: string, data?: any): void {
    if (this.shouldLog('warn')) {
      const entry = this.formatLog('warn', message, context, data);
      console.warn(`[${entry.timestamp}] [${entry.context || 'APP'}] ${entry.message}`, entry.data);
    }
  }

  error(message: string, context?: string, data?: any): void {
    if (this.shouldLog('error')) {
      const entry = this.formatLog('error', message, context, data);
      console.error(`[${entry.timestamp}] [${entry.context || 'APP'}] ${entry.message}`, entry.data);
    }
  }
}

export const logger = new Logger();
