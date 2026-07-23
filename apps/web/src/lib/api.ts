import {
  type ListShotAuthorsQuery,
  listShotAuthorsResponseSchema,
  type ListShotsQuery,
  listShotsResponseSchema,
  parseJsonResponse,
  SHOTS_PAGE_SIZE,
} from '@signets/shared';

import { apiFetch, apiUrl } from '@/lib/api-fetch';

export type ListShotAuthorsParams = Pick<
  ListShotAuthorsQuery,
  'favorites' | 'search'
>;

export type ListShotsParams = Pick<
  ListShotsQuery,
  'author' | 'favorites' | 'search'
>;

export async function fetchShotAuthors(
  params: ListShotAuthorsParams = {},
): Promise<Awaited<ReturnType<typeof listShotAuthorsResponseSchema.parse>>> {
  const url = apiUrl('/shots/authors');

  if (params.search) {
    url.searchParams.set('search', params.search);
  }
  if (params.favorites) {
    url.searchParams.set('favorites', 'true');
  }

  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load authors (${response.status})`);
  }

  return parseJsonResponse(listShotAuthorsResponseSchema, response);
}

export async function fetchShotsPage(
  params: ListShotsParams = {},
  cursor?: string,
): Promise<Awaited<ReturnType<typeof listShotsResponseSchema.parse>>> {
  const url = apiUrl('/shots');

  url.searchParams.set('limit', String(SHOTS_PAGE_SIZE));

  if (params.search) {
    url.searchParams.set('search', params.search);
  }
  if (params.author) {
    url.searchParams.set('author', params.author);
  }
  if (params.favorites) {
    url.searchParams.set('favorites', 'true');
  }
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load shots (${response.status})`);
  }

  return parseJsonResponse(listShotsResponseSchema, response);
}

export function xThumbnailUrl(
  imageUrl: string,
  size: 'large' | 'medium' | 'small',
) {
  const url = new URL(imageUrl);
  url.searchParams.set('name', size);
  return url.toString();
}
