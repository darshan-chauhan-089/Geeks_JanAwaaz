import { createContext, useCallback, useMemo, useRef, useState } from 'react';

/**
 * Global loading state that supports multiple concurrent loaders.
 *
 * Usage:
 *   const { startLoading, stopLoading, isLoading } = useLoading();
 *   startLoading('fetchIssues');
 *   stopLoading('fetchIssues');
 *   isLoading('fetchIssues')  // → boolean
 *   isLoading()               // → true if ANY key is loading
 */
export const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  // Map of key → count (supports nested/overlapping calls with same key)
  const [loadingMap, setLoadingMap] = useState({});
  // Ref for reading inside callbacks without stale closures
  const mapRef = useRef(loadingMap);
  mapRef.current = loadingMap;

  const startLoading = useCallback((key = 'global') => {
    setLoadingMap((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  }, []);

  const stopLoading = useCallback((key = 'global') => {
    setLoadingMap((prev) => {
      const next = { ...prev, [key]: Math.max(0, (prev[key] ?? 1) - 1) };
      if (next[key] === 0) delete next[key];
      return next;
    });
  }, []);

  const isLoading = useCallback((key) => {
    if (key === undefined) return Object.keys(mapRef.current).length > 0;
    return (mapRef.current[key] ?? 0) > 0;
  }, []);

  const value = useMemo(() => ({
    loadingMap,
    startLoading,
    stopLoading,
    isLoading,
  }), [loadingMap, startLoading, stopLoading, isLoading]);

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}
