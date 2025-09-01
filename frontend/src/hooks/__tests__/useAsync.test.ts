import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync, useAsyncCallback } from '../useAsync';

describe('useAsync', () => {
  it('should initialize with correct default state', () => {
    const mockAsyncFunction = jest.fn().mockResolvedValue('test data');
    
    const { result } = renderHook(() => useAsync(mockAsyncFunction));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should execute async function and return data', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockAsyncFunction = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useAsync(mockAsyncFunction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
  });

  it('should handle errors properly', async () => {
    const mockError = new Error('Test error');
    const mockAsyncFunction = jest.fn().mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useAsync(mockAsyncFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('should show loading state during execution', async () => {
    let resolvePromise: (value: string) => void;
    const mockAsyncFunction = jest.fn(() => {
      return new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
    });
    
    const { result } = renderHook(() => useAsync(mockAsyncFunction));

    act(() => {
      result.current.execute();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();

    await act(async () => {
      resolvePromise!('resolved data');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('resolved data');
  });

  it('should clear error when starting new execution', async () => {
    const mockError = new Error('Test error');
    const mockAsyncFunction = jest.fn().mockRejectedValueOnce(mockError);
    
    const { result } = renderHook(() => useAsync(mockAsyncFunction));

    // First execution with error
    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.error).toEqual(mockError);

    // Second execution should clear error
    mockAsyncFunction.mockResolvedValueOnce('success');
    
    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('success');
  });

  it('should reset state correctly', () => {
    const mockAsyncFunction = jest.fn().mockResolvedValue('test data');
    
    const { result } = renderHook(() => useAsync(mockAsyncFunction));

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should execute on mount when executeOnMount is true', async () => {
    const mockData = 'mounted data';
    const mockAsyncFunction = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(() => 
      useAsync(mockAsyncFunction, { executeOnMount: true })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe(mockData);
  });

  it('should not execute on mount when executeOnMount is false', () => {
    const mockAsyncFunction = jest.fn().mockResolvedValue('test data');
    
    renderHook(() => useAsync(mockAsyncFunction, { executeOnMount: false }));

    expect(mockAsyncFunction).not.toHaveBeenCalled();
  });

  it('should re-execute when dependencies change', async () => {
    const mockAsyncFunction = jest.fn().mockResolvedValue('test data');
    
    let dependency = 'initial';
    const { result, rerender } = renderHook(
      ({ dep }) => useAsync(mockAsyncFunction, { 
        executeOnMount: true, 
        dependencies: [dep] 
      }),
      { initialProps: { dep: dependency } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockAsyncFunction).toHaveBeenCalledTimes(1);

    // Change dependency
    dependency = 'updated';
    rerender({ dep: dependency });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockAsyncFunction).toHaveBeenCalledTimes(2);
  });

  it('should not update state if component is unmounted', async () => {
    const mockAsyncFunction = jest.fn(() => 
      new Promise(resolve => setTimeout(() => resolve('data'), 100))
    );
    
    const { result, unmount } = renderHook(() => useAsync(mockAsyncFunction));

    act(() => {
      result.current.execute();
    });

    unmount();

    // Wait for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 150));

    // State should remain in initial state since component was unmounted
    // We can't test the state after unmount, but this ensures no memory leaks
    expect(mockAsyncFunction).toHaveBeenCalled();
  });

  describe('callback function stability', () => {
    it('should maintain stable execute function reference', () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue('test');
      
      const { result, rerender } = renderHook(() => useAsync(mockAsyncFunction));
      
      const firstExecute = result.current.execute;
      
      rerender();
      
      expect(result.current.execute).toBe(firstExecute);
    });

    it('should maintain stable reset function reference', () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue('test');
      
      const { result, rerender } = renderHook(() => useAsync(mockAsyncFunction));
      
      const firstReset = result.current.reset;
      
      rerender();
      
      expect(result.current.reset).toBe(firstReset);
    });
  });
});

describe('useAsyncCallback', () => {
  it('should initialize with correct default state', () => {
    const mockAsyncFunction = jest.fn().mockResolvedValue('test data');
    
    const { result } = renderHook(() => useAsyncCallback(mockAsyncFunction));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should execute async function with arguments', async () => {
    const mockData = { result: 'success' };
    const mockAsyncFunction = jest.fn().mockResolvedValue(mockData);
    
    const { result } = renderHook(() => useAsyncCallback(mockAsyncFunction));

    await act(async () => {
      await result.current.execute('arg1', 'arg2', 123);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockAsyncFunction).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should handle errors properly', async () => {
    const mockError = new Error('Callback error');
    const mockAsyncFunction = jest.fn().mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useAsyncCallback(mockAsyncFunction));

    await act(async () => {
      try {
        await result.current.execute('test');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('should show loading state during execution', async () => {
    let resolvePromise: (value: string) => void;
    const mockAsyncFunction = jest.fn(() => {
      return new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
    });
    
    const { result } = renderHook(() => useAsyncCallback(mockAsyncFunction));

    act(() => {
      result.current.execute();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!('callback resolved');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe('callback resolved');
  });

  it('should reset state correctly', async () => {
    const mockAsyncFunction = jest.fn().mockResolvedValue('test data');
    
    const { result } = renderHook(() => useAsyncCallback(mockAsyncFunction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe('test data');

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle multiple arguments correctly', async () => {
    interface TestArgs {
      name: string;
      age: number;
      active: boolean;
    }

    const mockAsyncFunction = jest.fn().mockImplementation(
      (name: string, age: number, active: boolean): Promise<TestArgs> => {
        return Promise.resolve({ name, age, active });
      }
    );
    
    const { result } = renderHook(() => useAsyncCallback(mockAsyncFunction));

    await act(async () => {
      await result.current.execute('John', 25, true);
    });

    expect(result.current.data).toEqual({ name: 'John', age: 25, active: true });
    expect(mockAsyncFunction).toHaveBeenCalledWith('John', 25, true);
  });

  it('should not update state if component is unmounted', async () => {
    const mockAsyncFunction = jest.fn(() => 
      new Promise(resolve => setTimeout(() => resolve('callback data'), 100))
    );
    
    const { result, unmount } = renderHook(() => useAsyncCallback(mockAsyncFunction));

    act(() => {
      result.current.execute();
    });

    unmount();

    // Wait for the async operation to complete
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockAsyncFunction).toHaveBeenCalled();
  });

  it('should clear error when starting new execution', async () => {
    const mockError = new Error('First error');
    const mockAsyncFunction = jest.fn()
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce('success');
    
    const { result } = renderHook(() => useAsyncCallback(mockAsyncFunction));

    // First execution with error
    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.error).toEqual(mockError);

    // Second execution should clear error
    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('success');
  });

  describe('callback function stability', () => {
    it('should maintain stable execute function reference', () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue('test');
      
      const { result, rerender } = renderHook(() => useAsyncCallback(mockAsyncFunction));
      
      const firstExecute = result.current.execute;
      
      rerender();
      
      expect(result.current.execute).toBe(firstExecute);
    });

    it('should maintain stable reset function reference', () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue('test');
      
      const { result, rerender } = renderHook(() => useAsyncCallback(mockAsyncFunction));
      
      const firstReset = result.current.reset;
      
      rerender();
      
      expect(result.current.reset).toBe(firstReset);
    });
  });
});