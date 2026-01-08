import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setCacheItem, getCacheItem } from '@/lib/indexedDB';

interface UseOfflineDataOptions {
  table: string;
  cacheKey: string;
  query?: Record<string, unknown>;
  enabled?: boolean;
  ttlMs?: number;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

interface UseOfflineDataResult<T> {
  data: T[] | null;
  isLoading: boolean;
  isOnline: boolean;
  isFromCache: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOfflineData<T>({
  table,
  cacheKey,
  query = {},
  enabled = true,
  ttlMs = 24 * 60 * 60 * 1000, // 24 hours default
  orderBy,
  limit,
}: UseOfflineDataOptions): UseOfflineDataResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to load from cache first for instant display
      const cachedData = await getCacheItem<T[]>(cacheKey);
      if (cachedData && isMounted.current) {
        setData(cachedData);
        setIsFromCache(true);
      }

      // If online, fetch fresh data
      if (navigator.onLine) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let queryBuilder = supabase.from(table as any).select('*');

        // Apply filters
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            queryBuilder = (queryBuilder as any).eq(key, value);
          }
        });

        // Apply ordering
        if (orderBy) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryBuilder = (queryBuilder as any).order(orderBy.column, {
            ascending: orderBy.ascending ?? true,
          });
        }

        // Apply limit
        if (limit) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryBuilder = (queryBuilder as any).limit(limit);
        }

        const { data: freshData, error: fetchError } = await queryBuilder;

        if (fetchError) throw fetchError;

        if (isMounted.current) {
          setData(freshData as T[]);
          setIsFromCache(false);
          
          // Cache the fresh data
          if (freshData) {
            await setCacheItem(cacheKey, freshData, ttlMs);
          }
        }
      } else if (!cachedData) {
        // Offline and no cache - show empty state
        if (isMounted.current) {
          setData([]);
          setIsFromCache(true);
        }
      }
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, cacheKey, table, query, orderBy, limit, ttlMs]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && isFromCache && enabled) {
      fetchData();
    }
  }, [isOnline, isFromCache, enabled, fetchData]);

  return {
    data,
    isLoading,
    isOnline,
    isFromCache,
    error,
    refetch: fetchData,
  };
}

// Utility hook for caching single items
export function useOfflineSingleItem<T>(
  table: string,
  id: string | undefined,
  cacheKeyPrefix: string,
  enabled = true
): { data: T | null; isLoading: boolean; isOnline: boolean; isFromCache: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !id) {
      setIsLoading(false);
      return;
    }

    const fetchItem = async () => {
      setIsLoading(true);
      const cacheKey = `${cacheKeyPrefix}_${id}`;

      try {
        // Try cache first
        const cached = await getCacheItem<T>(cacheKey);
        if (cached) {
          setData(cached);
          setIsFromCache(true);
        }

        if (navigator.onLine) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: freshData, error } = await supabase
            .from(table as any)
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          setData(freshData as T);
          setIsFromCache(false);
          await setCacheItem(cacheKey, freshData);
        }
      } catch (err) {
        console.error(`Error fetching ${table} item:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [table, id, cacheKeyPrefix, enabled]);

  return { data, isLoading, isOnline, isFromCache };
}
