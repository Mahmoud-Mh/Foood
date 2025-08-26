import { Injectable, LoggerService, ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import * as fs from 'fs';
import * as path from 'path';

export interface LogContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  correlationId?: string;
  [key: string]: any;
}

@Injectable()
export class AppLoggerService extends ConsoleLogger implements LoggerService {
  private readonly logFilePath?: string;
  private readonly fileLoggingEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    super('Application');

    this.fileLoggingEnabled = process.env.LOG_FILE_ENABLED === 'true';
    this.logFilePath = process.env.LOG_FILE_PATH;

    if (this.fileLoggingEnabled && this.logFilePath) {
      this.ensureLogDirectory();
    }
  }

  private ensureLogDirectory(): void {
    if (!this.logFilePath) return;

    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private formatLogMessage(
    level: string,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] ${level.padEnd(5)} ${message} ${contextStr}\n`;
  }

  private writeToFile(
    level: string,
    message: string,
    context?: LogContext,
  ): void {
    if (!this.fileLoggingEnabled || !this.logFilePath) return;

    try {
      const formattedMessage = this.formatLogMessage(level, message, context);
      fs.appendFileSync(this.logFilePath, formattedMessage, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(message: any, context?: string): void {
    super.log(message, context);
    const logContext = typeof context === 'string' ? { context } : undefined;
    this.writeToFile('INFO', String(message), logContext);
  }

  error(message: any, stackOrContext?: string, context?: string): void {
    super.error(message, stackOrContext, context);
    const logContext =
      typeof context === 'string'
        ? { context, stack: stackOrContext }
        : typeof stackOrContext === 'string'
          ? { stack: stackOrContext }
          : undefined;
    this.writeToFile('ERROR', String(message), logContext);
  }

  warn(message: any, context?: string): void {
    super.warn(message, context);
    const logContext = typeof context === 'string' ? { context } : undefined;
    this.writeToFile('WARN', String(message), logContext);
  }

  debug(message: any, context?: string): void {
    if (this.configService.isDevelopment) {
      super.debug(message, context);
    }
    const logContext = typeof context === 'string' ? { context } : undefined;
    this.writeToFile('DEBUG', String(message), logContext);
  }

  verbose(message: any, context?: string): void {
    if (this.configService.isDevelopment) {
      super.verbose(message, context);
    }
    const logContext = typeof context === 'string' ? { context } : undefined;
    this.writeToFile('VERBOSE', String(message), logContext);
  }

  // Business-specific logging methods
  logUserAction(userId: string, action: string, details?: any): void {
    this.log(`User action: ${action}`, 'USER_ACTION');
    this.writeToFile('INFO', `User action: ${action}`, {
      userId,
      action,
      details: details as Record<string, unknown>,
      type: 'USER_ACTION',
    });
  }

  logSecurityEvent(event: string, context: LogContext): void {
    this.warn(`Security event: ${event}`, 'SECURITY');
    this.writeToFile('WARN', `Security event: ${event}`, {
      ...context,
      type: 'SECURITY',
      severity: 'HIGH',
    });
  }

  logApiRequest(
    method: string,
    url: string,
    userId?: string,
    ip?: string,
  ): void {
    this.log(`API Request: ${method} ${url}`, 'API_REQUEST');
    this.writeToFile('INFO', `API Request: ${method} ${url}`, {
      method,
      url,
      userId,
      ip,
      type: 'API_REQUEST',
    });
  }

  logApiResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
  ): void {
    const level =
      statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const message = `API Response: ${method} ${url} - ${statusCode} (${duration}ms)`;

    const context = {
      method,
      url,
      statusCode,
      duration,
      userId,
      type: 'API_RESPONSE',
    };

    if (level === 'ERROR') {
      this.error(message, undefined, 'API_RESPONSE');
      this.writeToFile('ERROR', message, context);
    } else if (level === 'WARN') {
      this.warn(message, 'API_RESPONSE');
      this.writeToFile('WARN', message, context);
    } else {
      this.log(message, 'API_RESPONSE');
      this.writeToFile('INFO', message, context);
    }
  }

  logDatabaseQuery(query: string, duration: number, error?: Error): void {
    if (error) {
      this.error(
        `Database query failed: ${error.message}`,
        error.stack,
        'DATABASE_ERROR',
      );
      this.writeToFile('ERROR', `Database query failed: ${error.message}`, {
        query: query.substring(0, 200), // Truncate long queries
        duration,
        type: 'DATABASE_ERROR',
        stack: error.stack,
      });
    } else {
      this.debug(`Database query executed (${duration}ms)`, 'DATABASE_QUERY');
      this.writeToFile('DEBUG', `Database query executed (${duration}ms)`, {
        query: query.substring(0, 200),
        duration,
        type: 'DATABASE_QUERY',
      });
    }
  }
}
