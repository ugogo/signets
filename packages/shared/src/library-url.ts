import { z } from 'zod';

import {
  DEFAULT_LIBRARY_DENSITY,
  DEFAULT_LIBRARY_VIEW_MODE,
  LIBRARY_DENSITY_MAX,
  LIBRARY_DENSITY_MIN,
} from './constants.js';

export type ViewMode = 'wall' | 'canvas';

export const librarySearchParamsSchema = z.object({
  author: z.string().nullable().optional(),
  density: z
    .number()
    .int()
    .min(LIBRARY_DENSITY_MIN)
    .max(LIBRARY_DENSITY_MAX)
    .default(DEFAULT_LIBRARY_DENSITY),
  favorites: z.boolean().default(false),
  search: z.string().nullable().optional(),
  viewMode: z.enum(['wall', 'canvas']).default(DEFAULT_LIBRARY_VIEW_MODE),
});

export type LibrarySearchParams = z.infer<typeof librarySearchParamsSchema>;

export const librarySearchParamsPartialSchema = librarySearchParamsSchema
  .partial()
  .extend({
    density: librarySearchParamsSchema.shape.density.optional(),
    favorites: librarySearchParamsSchema.shape.favorites.optional(),
    viewMode: librarySearchParamsSchema.shape.viewMode.optional(),
  });

export type LibrarySearchParamsPartial = z.infer<
  typeof librarySearchParamsPartialSchema
>;

export {
  DEFAULT_LIBRARY_DENSITY as DEFAULT_DENSITY,
  DEFAULT_LIBRARY_VIEW_MODE as DEFAULT_VIEW_MODE,
};
