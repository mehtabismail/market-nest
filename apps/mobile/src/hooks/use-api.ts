import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@marketnest/api-client';
import { api } from '../lib/api';

interface State<T> {
  data: T | null;
  loading: boolean;
  /** Already end-user safe — ApiError messages are mapped from HTTP status. */
  error: string | null;
}

/**
 * Fetch-on-mount with refetch. Deliberately small: a data layer like TanStack
 * Query is worth adding once caching and invalidation actually matter, not
 * before.
 */
export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    if (path === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.request<T>(path);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error:
          err instanceof ApiError || err instanceof Error
            ? err.message
            : 'Request failed. Please try again.',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
