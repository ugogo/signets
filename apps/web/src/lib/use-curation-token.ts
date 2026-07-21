import { useCallback, useSyncExternalStore } from 'react';

import {
  clearCurationToken,
  getCurationToken,
  setCurationToken,
  subscribeCurationToken,
} from './curation-token';

export function useCurationToken() {
  const token = useSyncExternalStore(
    subscribeCurationToken,
    () => getCurationToken(),
    () => null,
  );

  const saveToken = useCallback((value: string) => {
    setCurationToken(value);
  }, []);

  const clearToken = useCallback(() => {
    clearCurationToken();
  }, []);

  return {
    canCurate: Boolean(token && token.length >= 16),
    clearToken,
    saveToken,
    token,
  };
}
