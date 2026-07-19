import {
  createStandardSchemaV1,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs';

export type ViewMode = 'canvas' | 'wall';

export const DEFAULT_DENSITY = 55;
export const DEFAULT_VIEW_MODE: ViewMode = 'wall';

export const librarySearchParams = {
  author: parseAsString,
  density: parseAsInteger.withDefault(DEFAULT_DENSITY),
  favorites: parseAsBoolean.withDefault(false),
  search: parseAsString,
  viewMode: parseAsStringLiteral(['wall', 'canvas'] as const).withDefault(
    DEFAULT_VIEW_MODE,
  ),
};

export const librarySearchSchema = createStandardSchemaV1(librarySearchParams, {
  partialOutput: true,
});
