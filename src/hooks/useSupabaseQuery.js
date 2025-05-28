import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseclient';

/**
 * Custom hook for Supabase queries with loading and error states
 * @param {function} queryFn - Function that returns a Supabase query
 * @param {array} deps - Dependencies array for re-fetching
 * @param {object} options - Additional options
 * @returns {object} { data, loading, error, refetch }
 */
export const useSupabaseQuery = (queryFn, deps = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const queryFnRef = useRef(queryFn);
  const isMountedRef = useRef(true);
  
  const {
    onSuccess,
    onError,
    enabled = true,
    initialData = null,
    retryCount = 0, // Disabled by default to prevent infinite loops
    retryDelay = 1000
  } = options;

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update ref when queryFn changes
  useEffect(() => {
    queryFnRef.current = queryFn;
  });

  const executeQuery = useCallback(async (retryAttempt = 0) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      const query = queryFnRef.current();
      const { data: result, error: queryError } = await query;
      
      if (queryError) {
        // Special handling for "no rows returned" error
        if (queryError.code === 'PGRST116') {
          if (isMountedRef.current) {
            setData(initialData);
            onSuccess?.(initialData);
          }
        } else {
          throw queryError;
        }
      } else {
        if (isMountedRef.current) {
          setData(result);
          onSuccess?.(result);
        }
      }
    } catch (err) {
      console.error('Query error:', err);
      
      // Don't retry on network errors - they'll likely fail again
      const isNetworkError = err.message?.includes('NetworkError') || 
                            err.message?.includes('fetch');
      
      // Retry logic
      if (retryAttempt < retryCount && !isNetworkError) {
        setTimeout(() => {
          executeQuery(retryAttempt + 1);
        }, retryDelay * (retryAttempt + 1));
      } else {
        const errorMessage = err.message || 'An error occurred';
        if (isMountedRef.current) {
          setError(errorMessage);
          onError?.(err);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, onSuccess, onError, initialData, retryCount, retryDelay]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery, ...deps]);

  const refetch = useCallback(() => {
    executeQuery();
  }, [executeQuery]);

  return { data, loading, error, refetch };
};

/**
 * Custom hook for Supabase realtime subscriptions
 * @param {string} table - Table name to subscribe to
 * @param {function} onInsert - Callback for insert events
 * @param {function} onUpdate - Callback for update events
 * @param {function} onDelete - Callback for delete events
 * @param {object} filter - Optional filter for subscription
 * @returns {object} { unsubscribe }
 */
export const useSupabaseRealtime = (
  table,
  { onInsert, onUpdate, onDelete, filter } = {}
) => {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new);
              break;
            case 'UPDATE':
              onUpdate?.(payload.new, payload.old);
              break;
            case 'DELETE':
              onDelete?.(payload.old);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, onInsert, onUpdate, onDelete, filter]);
};

/**
 * Custom hook for paginated Supabase queries
 * @param {function} queryFn - Function that returns a Supabase query
 * @param {number} pageSize - Number of items per page
 * @param {array} deps - Dependencies array
 * @returns {object} Query result with pagination controls
 */
export const useSupabasePagination = (queryFn, pageSize = 10, deps = []) => {
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [allData, setAllData] = useState([]);
  
  const { data, loading, error, refetch } = useSupabaseQuery(
    () => queryFn().range(page * pageSize, (page + 1) * pageSize - 1),
    [page, ...deps],
    {
      onSuccess: (result) => {
        if (page === 0) {
          setAllData(result || []);
        } else {
          setAllData(prev => [...prev, ...(result || [])]);
        }
        setHasMore(result && result.length === pageSize);
      }
    }
  );
  
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);
  
  const reset = useCallback(() => {
    setPage(0);
    setAllData([]);
    setHasMore(true);
  }, []);
  
  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refetch
  };
};