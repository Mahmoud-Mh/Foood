import { ApiResponse } from '@/types/api.types';

export interface ErrorDetails {
  statusCode?: number;
  errorCode?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
  originalError?: unknown;
}

export class HttpError extends Error {
  public readonly status: number;
  public readonly errorCode?: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp?: string;
  public readonly path?: string;

  constructor(
    status: number,
    message: string,
    errorData?: ErrorDetails,
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.errorCode = errorData?.errorCode
    this.details = errorData?.details
    this.timestamp = errorData?.timestamp
    this.path = errorData?.path
  }

  // Helper methods for common error checks
  isValidationError(): boolean {
    return this.status === 400 && this.errorCode === 'VALIDATION_FAILED';
  }

  isAuthenticationError(): boolean {
    return this.status === 401;
  }

  isAuthorizationError(): boolean {
    return this.status === 403;
  }

  isNotFoundError(): boolean {
    return this.status === 404;
  }

  isConflictError(): boolean {
    return this.status === 409;
  }

  isRateLimitError(): boolean {
    return this.status === 429;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

export interface RequestConfig {
  headers?: Record<string, string>
  params?: Record<string, string | number>
  timeout?: number
}

export class HttpService {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private timeout: number

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    timeout: number = 10000,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
    this.timeout = timeout
  }

  public setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  public removeAuthToken(): void {
    delete this.defaultHeaders['Authorization']
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }
    
    return url.toString()
  }

  private mergeHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...customHeaders,
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: ApiResponse<T>
    
    try {
      data = (await response.json()) as ApiResponse<T>
    } catch (error) {
      throw new HttpError(
        response.status,
        'Invalid JSON response from server',
        { originalError: error as unknown },
      )
    }

    if (!response.ok) {
      const errorMessage = (data as Record<string, unknown>).message as string || `HTTP ${response.status}: ${response.statusText}`;
      const errorDetails: ErrorDetails = {
        statusCode: (data as Record<string, unknown>).statusCode as number || response.status,
        errorCode: (data as Record<string, unknown>).errorCode as string,
        details: (data as Record<string, unknown>).details as Record<string, unknown>,
        timestamp: (data as Record<string, unknown>).timestamp as string,
        path: (data as Record<string, unknown>).path as string,
      };
      
      throw new HttpError(response.status, errorMessage, errorDetails);
    }

    return data
  }

  public async get<T>(
    endpoint: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params)
    const headers = this.mergeHeaders(config?.headers)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })

      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  public async post<T, B = unknown>(
    endpoint: string,
    data?: B,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params)
    const headers = this.mergeHeaders(config?.headers)

    // Don't set Content-Type for FormData - let browser set it with boundary
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
    if (isFormData) {
      delete headers['Content-Type']
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: isFormData ? (data as unknown as BodyInit) : (data !== undefined ? JSON.stringify(data) : undefined),
        signal: controller.signal,
      })

      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  public async put<T, B = unknown>(
    endpoint: string,
    data?: B,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params)
    const headers = this.mergeHeaders(config?.headers)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout)

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data !== undefined ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })

      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  public async patch<T, B = unknown>(
    endpoint: string,
    data?: B,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params)
    const headers = this.mergeHeaders(config?.headers)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout)

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: data !== undefined ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })

      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  public async delete<T>(
    endpoint: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params)
    const headers = this.mergeHeaders(config?.headers)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout)

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        signal: controller.signal,
      })

      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }
} 