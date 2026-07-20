import {
  createStandardSchemaV1,
  createParser,
} from 'nuqs';
import { z } from 'zod';

export type ViewMode = 'wall' | 'canvas';

export const DEFAULT_DENSITY = 55;
export const DEFAULT_VIEW_MODE: ViewMode = 'wall';

const LIBRARY_DENSITY_MIN = 20;
const LIBRARY_DENSITY_MAX = 100;

export const librarySearchParamsSchema = z.object({
  author: z.string().nullable().optional(),
  density: z
    .number()
    .int()
    .min(LIBRARY_DENSITY_MIN)
    .max(LIBRARY_DENSITY_MAX)
    .default(DEFAULT_DENSITY),
  favorites: z.boolean().default(false),
  search: z.string().nullable().optional(),
  viewMode: z.enum(['wall', 'canvas']).default(DEFAULT_VIEW_MODE),
});

export type LibrarySearchParams = z.infer<typeof librarySearchParamsSchema>;

export const librarySearchParamsPartialSchema = librarySearchParamsSchema
  .partial()
  .extend({
    density: librarySearchParamsSchema.shape.density.optional(),
    favorites: librarySearchParamsSchema.shape.favorites.optional(),
    viewMode: librarySearchParamsSchema.shape.viewMode.optional(),
  });

function fieldParser<T>(schema: {
  safeParse: (value: unknown) => { success: true; data: T } | { success: false };
}) {
  return createParser({
    parse(value) {
      const parsed = schema.safeParse(value);
      return parsed.success ? parsed.data : null;
    },
    serialize(value) {
      return String(value);
    },
  });
}

export const librarySearchParams = {
  author: fieldParser(librarySearchParamsPartialSchema.shape.author),
  density: fieldParser(librarySearchParamsPartialSchema.shape.density).withDefault(
    DEFAULT_DENSITY,
  ),
  favorites: fieldParser(
    librarySearchParamsPartialSchema.shape.favorites,
  ).withDefault(false),
  search: fieldParser(librarySearchParamsPartialSchema.shape.search),
  viewMode: fieldParser(
    librarySearchParamsPartialSchema.shape.viewMode,
  ).withDefault(DEFAULT_VIEW_MODE),
};

export const librarySearchSchema = createStandardSchemaV1(librarySearchParams, {
  partialOutput: true,
});
