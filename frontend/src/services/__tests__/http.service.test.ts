import { HttpService, HttpError } from '../base/http.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('HttpService', () => {
  let httpService: HttpService;
  
  beforeEach(() => {
    httpService = new HttpService('http://localhost:3001/api');
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('GET requests', () => {
    it('should make a successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockResponse = {
        success: true,
        data: mockData
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await httpService.get<typeof mockData>('/test');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle GET request errors', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Not found'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(httpService.get('/not-found')).rejects.toThrow(HttpError);
    });
  });

  describe('POST requests', () => {
    it('should make a successful POST request with data', async () => {
      const requestData = { name: 'New Item' };
      const mockResponse = {
        success: true,
        data: { id: 1, ...requestData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await httpService.post('/items', requestData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/items',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should make POST request without data', async () => {
      const mockResponse = {
        success: true,
        message: 'Success'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await httpService.post('/action');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/action',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('PUT requests', () => {
    it('should make a successful PUT request', async () => {
      const updateData = { name: 'Updated Item' };
      const mockResponse = {
        success: true,
        data: { id: 1, ...updateData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await httpService.put('/items/1', updateData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/items/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(updateData),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('should make a successful DELETE request', async () => {
      const mockResponse = {
        success: true,
        message: 'Item deleted'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await httpService.delete('/items/1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/items/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Authentication', () => {
    it('should set auth token in headers', async () => {
      const token = 'test-token';
      httpService.setAuthToken(token);

      const mockResponse = { success: true, data: {} };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await httpService.get('/protected');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });

    it('should remove auth token from headers', async () => {
      httpService.setAuthToken('test-token');
      httpService.removeAuthToken();

      const mockResponse = { success: true, data: {} };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await httpService.get('/public');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/public',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything(),
          }),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(httpService.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors with custom messages', async () => {
      const errorMessage = 'Custom error message';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: errorMessage
        }),
      });

      await expect(httpService.get('/test')).rejects.toThrow(HttpError);
    });

    it('should handle responses without JSON', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(httpService.get('/test')).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      // Mock AbortController to simulate timeout
      const mockAbortController = {
        signal: { aborted: false },
        abort: jest.fn()
      };
      
      jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        // Immediately call the callback to trigger timeout
        callback();
        return 1 as any;
      });
      
      (fetch as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      );

      await expect(httpService.get('/test', { timeout: 1000 }))
        .rejects.toThrow('Request timeout');
      
      jest.restoreAllMocks();
    });
  });

  describe('Custom headers', () => {
    it('should include custom headers in requests', async () => {
      const customHeaders = { 'X-Custom-Header': 'custom-value' };
      
      const mockResponse = { success: true, data: {} };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await httpService.get('/test', { headers: customHeaders });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });

    it('should allow overriding default headers', async () => {
      const overrideHeaders = { 'Content-Type': 'application/xml' };
      
      const mockResponse = { success: true, data: {} };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await httpService.post('/test', {}, { headers: overrideHeaders });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/xml',
          }),
        })
      );
    });
  });

  describe('HttpError helper methods', () => {
    it('should identify validation errors correctly', () => {
      const validationError = new HttpError(400, 'Validation failed', { 
        errorCode: 'VALIDATION_FAILED' 
      });
      const otherError = new HttpError(400, 'Bad request');
      
      expect(validationError.isValidationError()).toBe(true);
      expect(otherError.isValidationError()).toBe(false);
    });

    it('should identify authentication errors correctly', () => {
      const authError = new HttpError(401, 'Unauthorized');
      const otherError = new HttpError(400, 'Bad request');
      
      expect(authError.isAuthenticationError()).toBe(true);
      expect(otherError.isAuthenticationError()).toBe(false);
    });

    it('should identify authorization errors correctly', () => {
      const authzError = new HttpError(403, 'Forbidden');
      const otherError = new HttpError(401, 'Unauthorized');
      
      expect(authzError.isAuthorizationError()).toBe(true);
      expect(otherError.isAuthorizationError()).toBe(false);
    });

    it('should identify not found errors correctly', () => {
      const notFoundError = new HttpError(404, 'Not found');
      const otherError = new HttpError(400, 'Bad request');
      
      expect(notFoundError.isNotFoundError()).toBe(true);
      expect(otherError.isNotFoundError()).toBe(false);
    });

    it('should identify conflict errors correctly', () => {
      const conflictError = new HttpError(409, 'Conflict');
      const otherError = new HttpError(400, 'Bad request');
      
      expect(conflictError.isConflictError()).toBe(true);
      expect(otherError.isConflictError()).toBe(false);
    });

    it('should identify rate limit errors correctly', () => {
      const rateLimitError = new HttpError(429, 'Too many requests');
      const otherError = new HttpError(400, 'Bad request');
      
      expect(rateLimitError.isRateLimitError()).toBe(true);
      expect(otherError.isRateLimitError()).toBe(false);
    });

    it('should identify server errors correctly', () => {
      const serverError1 = new HttpError(500, 'Internal server error');
      const serverError2 = new HttpError(502, 'Bad gateway');
      const clientError = new HttpError(400, 'Bad request');
      
      expect(serverError1.isServerError()).toBe(true);
      expect(serverError2.isServerError()).toBe(true);
      expect(clientError.isServerError()).toBe(false);
    });
  });

  describe('Query parameters', () => {
    it('should handle query parameters in GET requests', async () => {
      const mockResponse = { success: true, data: {} };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await httpService.get('/search', { 
        params: { q: 'test query', page: 1, limit: 10 } 
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/search?q=test+query&page=1&limit=10',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle query parameters in POST requests', async () => {
      const mockResponse = { success: true, data: {} };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await httpService.post('/items', { name: 'test' }, { 
        params: { action: 'create', notify: 1 } 
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/items?action=create&notify=1',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('PATCH requests', () => {
    it('should make a successful PATCH request', async () => {
      const patchData = { status: 'updated' };
      const mockResponse = {
        success: true,
        data: { id: 1, ...patchData }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await httpService.patch('/items/1', patchData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/items/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(patchData),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle PATCH timeout errors', async () => {
      const mockAbortController = {
        signal: { aborted: false },
        abort: jest.fn()
      };
      
      jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 1 as any;
      });
      
      (fetch as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      );

      await expect(httpService.patch('/items/1', {}, { timeout: 1000 }))
        .rejects.toThrow('Request timeout');
      
      jest.restoreAllMocks();
    });
  });

  describe('FormData handling', () => {
    it('should handle FormData in POST requests', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }));
      formData.append('name', 'test-file');

      const mockResponse = { success: true, data: { id: 1 } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await httpService.post('/upload', formData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/upload',
        expect.objectContaining({
          method: 'POST',
          body: formData,
          // Content-Type should be omitted for FormData
          headers: expect.not.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Additional timeout scenarios', () => {
    it('should handle PUT timeout errors', async () => {
      const mockAbortController = {
        signal: { aborted: false },
        abort: jest.fn()
      };
      
      jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 1 as any;
      });
      
      (fetch as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      );

      await expect(httpService.put('/items/1', {}, { timeout: 1000 }))
        .rejects.toThrow('Request timeout');
      
      jest.restoreAllMocks();
    });

    it('should handle DELETE timeout errors', async () => {
      const mockAbortController = {
        signal: { aborted: false },
        abort: jest.fn()
      };
      
      jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 1 as any;
      });
      
      (fetch as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      );

      await expect(httpService.delete('/items/1', { timeout: 1000 }))
        .rejects.toThrow('Request timeout');
      
      jest.restoreAllMocks();
    });

    it('should handle POST timeout errors', async () => {
      const mockAbortController = {
        signal: { aborted: false },
        abort: jest.fn()
      };
      
      jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 1 as any;
      });
      
      (fetch as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      );

      await expect(httpService.post('/items', {}, { timeout: 1000 }))
        .rejects.toThrow('Request timeout');
      
      jest.restoreAllMocks();
    });
  });
});