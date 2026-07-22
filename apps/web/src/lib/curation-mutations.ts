import type { Shot } from '@signets/shared';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteShot, toggleShotFavorite } from './curation-api';

export function useDeleteShot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShot,
    onSuccess: (_result, shotId) => {
      queryClient.setQueriesData<{ pages: { items: Shot[] }[] }>(
        { queryKey: ['shots'] },
        (existing) => {
          if (!existing) {
            return existing;
          }

          return {
            ...existing,
            pages: existing.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== shotId),
            })),
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ['shots'] });
    },
  });
}

export function useToggleShotFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleShotFavorite,
    onSuccess: (updatedShot: Shot) => {
      queryClient.setQueriesData<{ pages: { items: Shot[] }[] }>(
        { queryKey: ['shots'] },
        (existing) => {
          if (!existing) {
            return existing;
          }

          return {
            ...existing,
            pages: existing.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === updatedShot.id ? updatedShot : item,
              ),
            })),
          };
        },
      );
    },
  });
}
