import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  // Auth errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',

  // Recipe errors
  RECIPE_NOT_FOUND = 'RECIPE_NOT_FOUND',
  RECIPE_ACCESS_DENIED = 'RECIPE_ACCESS_DENIED',
  INVALID_RECIPE_STATUS = 'INVALID_RECIPE_STATUS',

  // File upload errors
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // Database errors
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // General errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Record<string, unknown>,
  ) {
    super(
      {
        statusCode,
        errorCode,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );

    this.errorCode = errorCode;
    this.details = details;
  }

  // Factory methods for common exceptions
  static userAlreadyExists(email: string): BusinessException {
    return new BusinessException(
      ErrorCode.USER_ALREADY_EXISTS,
      'A user with this email address already exists',
      HttpStatus.CONFLICT,
      { email },
    );
  }

  static invalidCredentials(): BusinessException {
    return new BusinessException(
      ErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password',
      HttpStatus.UNAUTHORIZED,
    );
  }

  static accountDisabled(): BusinessException {
    return new BusinessException(
      ErrorCode.ACCOUNT_DISABLED,
      'Your account has been disabled. Please contact support.',
      HttpStatus.FORBIDDEN,
    );
  }

  static recipeNotFound(id: string): BusinessException {
    return new BusinessException(
      ErrorCode.RECIPE_NOT_FOUND,
      'Recipe not found',
      HttpStatus.NOT_FOUND,
      { recipeId: id },
    );
  }

  static recipeAccessDenied(): BusinessException {
    return new BusinessException(
      ErrorCode.RECIPE_ACCESS_DENIED,
      'You do not have permission to access this recipe',
      HttpStatus.FORBIDDEN,
    );
  }

  static invalidFileType(allowedTypes: string[]): BusinessException {
    return new BusinessException(
      ErrorCode.INVALID_FILE_TYPE,
      'Invalid file type',
      HttpStatus.BAD_REQUEST,
      { allowedTypes },
    );
  }

  static fileTooLarge(maxSize: number): BusinessException {
    return new BusinessException(
      ErrorCode.FILE_TOO_LARGE,
      'File size exceeds maximum allowed size',
      HttpStatus.BAD_REQUEST,
      { maxSizeBytes: maxSize },
    );
  }

  static resourceNotFound(resource: string, id: string): BusinessException {
    return new BusinessException(
      ErrorCode.RESOURCE_NOT_FOUND,
      `${resource} not found`,
      HttpStatus.NOT_FOUND,
      { resource, id },
    );
  }

  static validationFailed(
    errors: Record<string, unknown>[],
  ): BusinessException {
    return new BusinessException(
      ErrorCode.VALIDATION_FAILED,
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      { validationErrors: errors },
    );
  }

  static insufficientPermissions(requiredRole?: string): BusinessException {
    return new BusinessException(
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      'You do not have sufficient permissions for this action',
      HttpStatus.FORBIDDEN,
      { requiredRole },
    );
  }

  static duplicateEntry(field: string, value: string): BusinessException {
    return new BusinessException(
      ErrorCode.DUPLICATE_ENTRY,
      `A record with this ${field} already exists`,
      HttpStatus.CONFLICT,
      { field, value },
    );
  }
}
