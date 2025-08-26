import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';

interface ErrorResponse {
  statusCode: number;
  message: string;
  errorCode?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  [key: string]: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    let errorResponse: ErrorResponse;

    if (exception instanceof BusinessException) {
      // Handle our custom business exceptions
      errorResponse = {
        statusCode: exception.getStatus(),
        message: exception.message,
        errorCode: exception.errorCode,
        details: exception.details as Record<string, unknown>,
        timestamp: new Date().toISOString(),
        path,
      };

      this.logger.warn(
        `Business Exception: ${exception.errorCode} - ${exception.message}`,
        {
          path,
          details: exception.details as Record<string, unknown>,
          stack: exception.stack,
        },
      );
    } else if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        statusCode: status,
        message: this.extractMessage(
          exceptionResponse as string | HttpExceptionResponse,
        ),
        timestamp: new Date().toISOString(),
        path,
      };

      // Add validation details for 400 errors
      if (
        status === (HttpStatus.BAD_REQUEST as number) &&
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        errorResponse.details = exceptionResponse as Record<string, unknown>;
      }

      this.logger.warn(`HTTP Exception: ${status} - ${errorResponse.message}`, {
        path,
        exceptionResponse,
      });
    } else if (exception instanceof Error) {
      // Handle generic errors
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        path,
      };

      this.logger.error('Unhandled Exception', {
        message: exception.message,
        stack: exception.stack,
        path,
      });

      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'development') {
        errorResponse.details = {
          originalMessage: exception.message,
          stack: exception.stack,
        };
      }
    } else {
      // Handle unknown exceptions
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        path,
      };

      this.logger.error('Unknown Exception', {
        exception,
        path,
      });
    }

    // Log security-related errors with higher severity
    if (
      errorResponse.statusCode === (HttpStatus.UNAUTHORIZED as number) ||
      errorResponse.statusCode === (HttpStatus.FORBIDDEN as number)
    ) {
      this.logger.warn('Security Exception', {
        ip: request.ip,
        userAgent: request.get('User-Agent') || 'unknown',
        path,
        statusCode: errorResponse.statusCode,
      });
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private extractMessage(
    exceptionResponse: string | HttpExceptionResponse,
  ): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if (exceptionResponse.message) {
        if (Array.isArray(exceptionResponse.message)) {
          return exceptionResponse.message.join(', ');
        }
        return exceptionResponse.message;
      }
      if (exceptionResponse.error) {
        return exceptionResponse.error;
      }
    }

    return 'Unknown error';
  }
}
