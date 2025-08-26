import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../logger/logger.service';

interface LoggedRequest extends Request {
  startTime?: number;
  correlationId?: string;
  userId?: string;
}

interface JwtPayload {
  sub?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: LoggedRequest, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    req.startTime = startTime;
    req.correlationId = this.generateCorrelationId();

    // Extract user ID from JWT if available
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.parseJwtPayload(token);
        req.userId = payload?.sub;
      } catch {
        // Ignore JWT parsing errors for logging middleware
      }
    }

    // Skip logging for health checks and static assets
    if (this.shouldSkipLogging(req.originalUrl)) {
      return next();
    }

    // Log request
    this.logger.logApiRequest(
      req.method,
      req.originalUrl,
      req.userId,
      this.getClientIp(req),
    );

    // Override res.end to capture response
    const originalEnd = res.end.bind(res) as (
      chunk?: any,
      encoding?: BufferEncoding | (() => void),
      cb?: () => void,
    ) => Response;
    const logger = this.logger;

    res.end = function (
      chunk?: any,
      encoding?: BufferEncoding | (() => void),
      cb?: () => void,
    ): Response {
      const duration = Date.now() - startTime;

      // Log response
      logger.logApiResponse(
        req.method,
        req.originalUrl,
        res.statusCode,
        duration,
        req.userId,
      );

      // Log slow requests (> 1 second)
      if (duration > 1000) {
        logger.warn(
          `Slow API request detected: ${req.method} ${req.originalUrl} (${duration}ms)`,
          'SLOW_REQUEST',
        );
      }

      // Log error responses with additional context
      if (res.statusCode >= 400) {
        if (res.statusCode >= 500) {
          logger.error(
            `Server error: ${req.method} ${req.originalUrl}`,
            undefined,
            'Application',
          );
        } else {
          logger.warn(
            `Client error: ${req.method} ${req.originalUrl}`,
            'Application',
          );
        }
      }

      // Handle different argument signatures of res.end
      if (typeof encoding === 'function') {
        return originalEnd.call(this, chunk, encoding) as Response;
      }
      return originalEnd.call(this, chunk, encoding, cb) as Response;
    };

    next();
  }

  private shouldSkipLogging(url: string): boolean {
    const skipPatterns = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/robots.txt',
      '.css',
      '.js',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.ico',
    ];

    return skipPatterns.some((pattern) => url.includes(pattern));
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  private parseJwtPayload(token: string): JwtPayload | null {
    try {
      const base64Payload = token.split('.')[1];
      if (!base64Payload) {
        return null;
      }
      const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
      return JSON.parse(payload) as JwtPayload;
    } catch {
      return null;
    }
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
      const forwardedValue = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded;
      return forwardedValue.split(',')[0].trim();
    }

    // Try various ways to get the IP address
    const connection = req.connection || req.socket;
    const remoteAddress = connection?.remoteAddress;

    if (remoteAddress) {
      return remoteAddress;
    }

    // Last resort for legacy Node.js versions
    const legacyConnection = req.connection as
      | { socket?: { remoteAddress?: string } }
      | undefined;
    return legacyConnection?.socket?.remoteAddress || 'unknown';
  }
}
