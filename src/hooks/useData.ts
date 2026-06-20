import { useEffect, useState } from 'react';

/**
 * Custom hook for subscribing to real-time data from Firebase
 */
export const useRealtimeData = <T,>(
  subscribe: (callback: (data: T) => void) => () => void,
  initialValue: T
) => {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);

    try {
      const unsubscribe = subscribe((newData) => {
        setData(newData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setLoading(false);
      return () => {};
    }
  }, [subscribe]);

  return { data, loading, error };
};

/**
 * Custom hook for fetching data once from Firebase
 */
export const useFetchData = <T,>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetch = async () => {
      try {
        setLoading(true);
        const result = await fetchFn();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          setError(errorObj);
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, loading, error };
};
