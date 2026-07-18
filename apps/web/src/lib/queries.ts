import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import type { ListShotsResponse } from '@signets/shared';

import {
  fetchShotAuthors,
  fetchShotsPage,
  type ListShotAuthorsParams,
  type ListShotsParams,
} from '../lib/api';

export function useInfiniteShots(params: ListShotsParams) {
  return useInfiniteQuery({
    getNextPageParam: (lastPage: ListShotsResponse) =>
      lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchShotsPage(params, pageParam),
    queryKey: ['shots', params],
  });
}

export function useShotAuthors(params: ListShotAuthorsParams) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchShotAuthors(params),
    queryKey: ['shots', 'authors', params],
  });
}
