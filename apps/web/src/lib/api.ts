import type { Shot } from '@signets/shared';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface ListShotsParams {
  author?: string;
  favorites?: boolean;
  search?: string;
}

export async function fetchShots(
  params: ListShotsParams = {},
): Promise<Shot[]> {
  const url = new URL('/shots', apiBaseUrl);

  if (params.search) {
    url.searchParams.set('search', params.search);
  }
  if (params.author) {
    url.searchParams.set('author', params.author);
  }
  if (params.favorites) {
    url.searchParams.set('favorites', 'true');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load shots (${response.status})`);
  }

  return response.json() as Promise<Shot[]>;
}

export function xThumbnailUrl(
  imageUrl: string,
  size: 'large' | 'medium' | 'small',
) {
  const url = new URL(imageUrl);
  url.searchParams.set('name', size);
  return url.toString();
}
