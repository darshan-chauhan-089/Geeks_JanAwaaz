import { useCallback, useEffect, useRef, useState } from 'react';
import { issueService } from '@services/issueService';

/**
 * Paginated issue list with sort / filter / refetch support.
 *
 * @param {object}          initialParams   Initial query params (page, limit, sort, …)
 * @param {object|boolean}  options         { fetchOnMount?: boolean } — or a plain boolean (legacy)
 *
 * Returns:
 *   issues, setIssues, updateIssue   — the list + direct write helpers
 *   pagination                        — { currentPage, totalPages, hasNextPage, hasPrevPage, total }
 *   isLoading, error
 *   refetch(overrides?), nextPage(), prevPage()
 */
export function useIssues(initialParams = {}, options = {}) {
  // Accept both legacy boolean and new object form
  const fetchOnMount =
    typeof options === 'boolean' ? options : (options.fetchOnMount ?? true);

  // Optional custom fetcher — defaults to issueService.getIssues
  const fetcher =
    (typeof options === 'object' && options.fetcher) || issueService.getIssues;

  const [issues,     setIssues]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState(null);

  // Keep params in a ref so the `fetch` closure is always current without
  // needing to be in the useCallback dependency array.
  const paramsRef  = useRef({ page: 1, limit: 20, ...initialParams });
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; }); // keep in sync

  const fetchIssues = useCallback(async (overrides = {}) => {
    if (Object.keys(overrides).length) {
      paramsRef.current = { ...paramsRef.current, ...overrides };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current(paramsRef.current);
      setIssues(result.issues ?? []);
      setPagination(result.pagination ?? null);
    } catch (err) {
      setError(err.message ?? 'Failed to load issues.');
    } finally {
      setIsLoading(false);
    }
  }, []); // stable — no external deps

  useEffect(() => {
    if (fetchOnMount) fetchIssues();
  }, [fetchIssues, fetchOnMount]);

  const nextPage = useCallback(() => {
    if (!pagination?.hasNextPage) return;
    fetchIssues({ page: pagination.currentPage + 1 });
  }, [fetchIssues, pagination]);

  const prevPage = useCallback(() => {
    if (!pagination?.hasPrevPage) return;
    fetchIssues({ page: pagination.currentPage - 1 });
  }, [fetchIssues, pagination]);

  const refetch = useCallback(
    (params) => fetchIssues(params ?? {}),
    [fetchIssues],
  );

  /**
   * Optimistically update a single issue in the list without a refetch.
   * @param {string}   id       — issue._id
   * @param {function} updater  — (prevIssue) => updatedIssue
   */
  const updateIssue = useCallback((id, updater) => {
    setIssues((prev) =>
      prev.map((issue) => (issue._id === id ? updater(issue) : issue)),
    );
  }, []);

  return {
    issues,
    setIssues,
    updateIssue,
    pagination,
    isLoading,
    error,
    refetch,
    nextPage,
    prevPage,
  };
}

