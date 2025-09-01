import { renderHook } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { useErrorHandler } from '../useErrorHandler';

// Mock dependencies
jest.mock('react-hot-toast');

const mockToast = toast as jest.Mocked<typeof toast>;

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('handleError', () => {
    it('should handle Error objects with default options', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error message');

      const returnedError = result.current.handleError(testError);

      expect(console.error).toHaveBeenCalledWith('Error handled:', testError);
      expect(mockToast.error).toHaveBeenCalledWith('Test error message');
      expect(returnedError).toBe(testError);
    });

    it('should handle non-Error objects by converting them to Error', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = 'String error';

      const returnedError = result.current.handleError(testError);

      expect(console.error).toHaveBeenCalledWith('Error handled:', expect.any(Error));
      expect(mockToast.error).toHaveBeenCalledWith('String error');
      expect(returnedError).toBeInstanceOf(Error);
      expect(returnedError.message).toBe('String error');
    });

    it('should respect showToast option', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error');

      result.current.handleError(testError, { showToast: false });

      expect(mockToast.error).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error handled:', testError);
    });

    it('should respect logToConsole option', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error');

      result.current.handleError(testError, { logToConsole: false });

      expect(console.error).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('Test error');
    });

    it('should throw error when throwError is true', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error');

      expect(() => {
        result.current.handleError(testError, { throwError: true });
      }).toThrow('Test error');

      expect(console.error).toHaveBeenCalledWith('Error handled:', testError);
      expect(mockToast.error).toHaveBeenCalledWith('Test error');
    });

    it('should use custom message when provided', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Original error');
      const customMessage = 'Custom error message';

      result.current.handleError(testError, { customMessage });

      expect(mockToast.error).toHaveBeenCalledWith(customMessage);
      expect(console.error).toHaveBeenCalledWith('Error handled:', testError);
    });

    it('should handle combined options correctly', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error');

      expect(() => {
        result.current.handleError(testError, {
          showToast: false,
          logToConsole: false,
          throwError: true,
          customMessage: 'Custom message'
        });
      }).toThrow('Test error');

      expect(console.error).not.toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });

  describe('handleApiError', () => {
    it('should handle errors with message property', () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError = { message: 'API error message' };

      const returnedError = result.current.handleApiError(apiError);

      expect(mockToast.error).toHaveBeenCalledWith('API error message');
      expect(returnedError.message).toBe('API error message');
    });

    it('should handle HTTP status codes correctly', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const statusTests = [
        { status: 401, expectedMessage: 'You are not authorized. Please log in again.' },
        { status: 403, expectedMessage: 'You do not have permission to perform this action.' },
        { status: 404, expectedMessage: 'The requested resource was not found.' },
        { status: 429, expectedMessage: 'Too many requests. Please try again later.' },
        { status: 500, expectedMessage: 'Server error. Please try again later.' },
        { status: 418, expectedMessage: 'Request failed with status 418' }
      ];

      statusTests.forEach(({ status, expectedMessage }) => {
        const apiError = { status };
        const returnedError = result.current.handleApiError(apiError);
        
        expect(returnedError.message).toBe(expectedMessage);
        expect(mockToast.error).toHaveBeenCalledWith(expectedMessage);
      });
    });

    it('should prioritize status code over message', () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError = { message: 'Custom API message', status: 404 };

      const returnedError = result.current.handleApiError(apiError);

      expect(returnedError.message).toBe('The requested resource was not found.');
      expect(mockToast.error).toHaveBeenCalledWith('The requested resource was not found.');
    });

    it('should handle errors without message or status', () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError = { someOtherProperty: 'value' };

      const returnedError = result.current.handleApiError(apiError);

      expect(returnedError.message).toBe('An unexpected error occurred');
      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });

    it('should use custom message from options when provided', () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError = { message: 'Original message' };
      const customMessage = 'Override message';

      result.current.handleApiError(apiError, { customMessage });

      expect(mockToast.error).toHaveBeenCalledWith(customMessage);
    });

    it('should pass options to handleError', () => {
      const { result } = renderHook(() => useErrorHandler());
      const apiError = { message: 'API error' };

      result.current.handleApiError(apiError, { showToast: false, logToConsole: false });

      expect(mockToast.error).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('handleAsyncError', () => {
    it('should handle successful async function', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const successValue = 'success result';
      const asyncFn = jest.fn().mockResolvedValue(successValue);

      const returnedValue = await result.current.handleAsyncError(asyncFn);

      expect(returnedValue).toBe(successValue);
      expect(asyncFn).toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle async function errors', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(testError);

      const returnedValue = await result.current.handleAsyncError(asyncFn);

      expect(returnedValue).toBeUndefined();
      expect(asyncFn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error handled:', testError);
      expect(mockToast.error).toHaveBeenCalledWith('Async error');
    });

    it('should pass options to handleError for async errors', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(testError);

      const returnedValue = await result.current.handleAsyncError(asyncFn, {
        showToast: false,
        customMessage: 'Custom async message'
      });

      expect(returnedValue).toBeUndefined();
      expect(mockToast.error).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error handled:', testError);
    });

    it('should handle complex async functions', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const complexResult = { data: [1, 2, 3], status: 'ok' };
      const asyncFn = jest.fn().mockResolvedValue(complexResult);

      const returnedValue = await result.current.handleAsyncError(asyncFn);

      expect(returnedValue).toEqual(complexResult);
      expect(asyncFn).toHaveBeenCalled();
    });
  });

  describe('getErrorMessage helper', () => {
    it('should handle network errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      const networkError = new Error('Network request failed');

      result.current.handleError(networkError);

      expect(mockToast.error).toHaveBeenCalledWith('Network connection failed. Please check your internet connection.');
    });

    it('should handle fetch errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      const fetchError = new Error('Failed to fetch data');

      result.current.handleError(fetchError);

      expect(mockToast.error).toHaveBeenCalledWith('Failed to connect to server. Please try again.');
    });

    it('should handle timeout errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      const timeoutError = new Error('Request timeout occurred');

      result.current.handleError(timeoutError);

      expect(mockToast.error).toHaveBeenCalledWith('Request timed out. Please try again.');
    });

    it('should handle JSON parsing errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      const jsonError = new Error('Invalid JSON response');

      result.current.handleError(jsonError);

      expect(mockToast.error).toHaveBeenCalledWith('Invalid server response. Please try again.');
    });

    it('should handle long error messages', () => {
      const { result } = renderHook(() => useErrorHandler());
      const longMessage = 'A'.repeat(150);
      const longError = new Error(longMessage);

      result.current.handleError(longError);

      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });

    it('should handle short custom error messages', () => {
      const { result } = renderHook(() => useErrorHandler());
      const shortError = new Error('Short message');

      result.current.handleError(shortError);

      expect(mockToast.error).toHaveBeenCalledWith('Short message');
    });

    it('should handle errors without messages', () => {
      const { result } = renderHook(() => useErrorHandler());
      const emptyError = new Error('');

      result.current.handleError(emptyError);

      expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });

  describe('callback stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useErrorHandler());
      
      const firstHandleError = result.current.handleError;
      const firstHandleApiError = result.current.handleApiError;
      const firstHandleAsyncError = result.current.handleAsyncError;
      
      rerender();
      
      expect(result.current.handleError).toBe(firstHandleError);
      expect(result.current.handleApiError).toBe(firstHandleApiError);
      expect(result.current.handleAsyncError).toBe(firstHandleAsyncError);
    });
  });
});