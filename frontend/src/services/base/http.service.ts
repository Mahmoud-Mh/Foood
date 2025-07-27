import { ApiResponse } from '@/types/api.types';

export class HttpError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  timeout?: number;
}

export class HttpService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    timeout: number = 10000
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.timeout = timeout;
  }

  public setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  public removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return url.toString();
  }

  private mergeHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...customHeaders,
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: ApiResponse<T>;
    
    try {
      data = await response.json();
    } catch (error) {
      throw new HttpError(
        response.status,
        'Invalid JSON response from server',
        { originalError: error }
      );
    }

    if (!response.ok) {
      throw new HttpError(
        response.status,
        data.message || `HTTP ${response.status}: ${response.statusText}`,
        data
      );
    }

    return data;
  }

  public async get<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.mergeHeaders(config?.headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.mergeHeaders(config?.headers);

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.mergeHeaders(config?.headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.mergeHeaders(config?.headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.mergeHeaders(config?.headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        signal: controller.signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(408, 'Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
} 