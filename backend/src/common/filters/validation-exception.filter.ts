/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

interface ValidationErrorResponse {
  success: false;
  message: string;
  error: string;
  details?: {
    field: string;
    value: any;
    constraints: string[];
  }[];
  timestamp: string;
  path: string;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Check if this is a validation error
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;

      if (Array.isArray(responseObj.message)) {
        // This is a class-validator error
        const validationDetails = this.formatValidationErrors(
          responseObj.message,
        );

        const errorResponse: ValidationErrorResponse = {
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          details: validationDetails,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        return response.status(status).json(errorResponse);
      }
    }

    // Default error response for non-validation BadRequestExceptions
    const errorResponse = {
      success: false,
      message: exception.message || 'Bad Request',
      error: 'BAD_REQUEST',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(errors: any[]): Array<{
    field: string;
    value: any;
    constraints: string[];
  }> {
    const result: Array<{
      field: string;
      value: any;
      constraints: string[];
    }> = [];

    const processError = (error: ValidationError, parentPath = '') => {
      const fieldPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        result.push({
          field: fieldPath,
          value: error.value,
          constraints: Object.values(error.constraints),
        });
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        error.children.forEach((childError) => {
          processError(childError, fieldPath);
        });
      }
    };

    // Process each error (could be string or ValidationError object)
    errors.forEach((error) => {
      if (typeof error === 'string') {
        // Simple string error
        result.push({
          field: 'unknown',
          value: undefined,
          constraints: [error],
        });
      } else if (error && typeof error === 'object') {
        // ValidationError object
        processError(error);
      }
    });

    return result;
  }
}

/**
 * Helper function to get user-friendly field names
 */
export function getFieldDisplayName(fieldPath: string): string {
  const fieldMappings: Record<string, string> = {
    title: 'Recipe Title',
    description: 'Recipe Description',
    instructions: 'Instructions',
    prepTimeMinutes: 'Preparation Time',
    cookTimeMinutes: 'Cooking Time',
    servings: 'Number of Servings',
    categoryId: 'Category',
    difficulty: 'Difficulty Level',
    imageUrl: 'Main Image',
    ingredients: 'Ingredients List',
    steps: 'Recipe Steps',
    'nutritionalInfo.calories': 'Calories',
    'nutritionalInfo.protein': 'Protein',
    'nutritionalInfo.carbs': 'Carbohydrates',
    'nutritionalInfo.fat': 'Fat',
    'nutritionalInfo.fiber': 'Fiber',
    tags: 'Recipe Tags',
    notes: 'Recipe Notes',
  };

  return fieldMappings[fieldPath] || fieldPath;
}
