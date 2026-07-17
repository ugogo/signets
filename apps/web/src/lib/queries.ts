import { useQuery } from '@tanstack/react-query';

import { fetchShots, type ListShotsParams } from '../lib/api';

export function useShots(params: ListShotsParams) {
  return useQuery({
    queryFn: () => fetchShots(params),
    queryKey: ['shots', params],
  });
}
