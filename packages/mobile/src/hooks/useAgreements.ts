import * as React from 'react';
import { agreementsApi } from '../api/agreements';
import type { Agreement, AgreementsListResponse } from '../types/api';

export interface UseAgreementsResult {
  agreements: Agreement[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * Hook that fetches and paginates the authenticated user's agreements list.
 */
export function useAgreements(): UseAgreementsResult {
  const [agreements, setAgreements] = React.useState<Agreement[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPage = React.useCallback(
    async (pageNum: number, replace: boolean): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const result: AgreementsListResponse = await agreementsApi.list(pageNum);
        setAgreements((prev) => (replace ? result.data : [...prev, ...result.data]));
        setTotal(result.total);
        setPage(pageNum);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load agreements');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void fetchPage(1, true);
  }, [fetchPage]);

  const refresh = React.useCallback((): Promise<void> => fetchPage(1, true), [fetchPage]);

  const loadMore = React.useCallback((): Promise<void> => {
    if (agreements.length >= total) return Promise.resolve();
    return fetchPage(page + 1, false);
  }, [agreements.length, total, page, fetchPage]);

  return { agreements, total, isLoading, error, refresh, loadMore };
}
