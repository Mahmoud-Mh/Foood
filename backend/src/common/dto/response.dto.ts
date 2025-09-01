import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data?: T;

  @ApiProperty({ description: 'Error details', required: false })
  error?: string | Record<string, unknown>;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    error?: string | Record<string, unknown>,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
  }

  static success<T>(message: string, data?: T): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data);
  }

  static error(
    message: string,
    error?: string | Record<string, unknown>,
  ): ApiResponseDto {
    return new ApiResponseDto(false, message, undefined, error);
  }
}

export class PaginatedResponseDto<T = unknown> {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Paginated response data' })
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    success: boolean,
    message: string,
    items: T[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.success = success;
    this.message = message;
    this.data = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  static success<T>(
    message: string,
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(true, message, items, total, page, limit);
  }
}

// Aliases for backward compatibility
export { ApiResponseDto as ResponseDto };
export { PaginatedResponseDto as PaginatedResult };
