import {
  createStandardSchemaV1,
  createParser,
} from 'nuqs';
import {
  DEFAULT_DENSITY,
  DEFAULT_VIEW_MODE,
  librarySearchParamsPartialSchema,
  type ViewMode,
} from '@signets/shared';

export type { ViewMode };

export { DEFAULT_DENSITY, DEFAULT_VIEW_MODE };

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
