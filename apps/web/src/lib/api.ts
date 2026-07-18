import type { ListShotsResponse } from '@signets/shared';

/** Keep in sync with SHOTS_PAGE_SIZE in @signets/shared */
const SHOTS_PAGE_SIZE = 24;

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface ListShotsParams {
  author?: string;
  favorites?: boolean;
  search?: string;
}

export interface ListShotAuthorsParams {
  favorites?: boolean;
  search?: string;
}

export async function fetchShotsPage(
  params: ListShotsParams = {},
  cursor?: string,
): Promise<ListShotsResponse> {
  const url = new URL('/shots', apiBaseUrl);

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

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load shots (${response.status})`);
  }

  return response.json() as Promise<ListShotsResponse>;
}

export async function fetchShotAuthors(
  params: ListShotAuthorsParams = {},
): Promise<string[]> {
  const url = new URL('/shots/authors', apiBaseUrl);

  if (params.search) {
    url.searchParams.set('search', params.search);
  }
  if (params.favorites) {
    url.searchParams.set('favorites', 'true');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load authors (${response.status})`);
  }

  return response.json() as Promise<string[]>;
}

export function xThumbnailUrl(
  imageUrl: string,
  size: 'large' | 'medium' | 'small',
) {
  const url = new URL(imageUrl);
  url.searchParams.set('name', size);
  return url.toString();
}
