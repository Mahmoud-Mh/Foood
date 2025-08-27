import { useState, useCallback, useEffect, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface AsyncOptions {
  executeOnMount?: boolean;
  dependencies?: unknown[];
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: AsyncOptions = {}
) {
  const { executeOnMount = false, dependencies = [] } = options;
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (error) {
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: error as Error });
      }
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (executeOnMount) {
      execute();
    }
  }, dependencies);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export function useAsyncCallback<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const mountedRef = useRef(true);

  const execute = useCallback(async (...args: Args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction(...args);
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (error) {
      if (mountedRef.current) {
        setState({ data: null, loading: false, error: error as Error });
      }
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}