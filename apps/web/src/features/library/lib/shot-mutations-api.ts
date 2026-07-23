import type { Shot } from '@signets/shared';

import { shotSchema } from '@signets/shared';

import { apiFetchOptions, apiUrl } from '@/lib/api-fetch';

export async function deleteShot(id: string): Promise<void> {
  const response = await fetch(apiUrl(`/shots/${id}`), {
    ...apiFetchOptions,
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function toggleShotFavorite(id: string): Promise<Shot> {
  const response = await fetch(apiUrl(`/shots/${id}/favorite`), {
    ...apiFetchOptions,
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const body: unknown = await response.json();
  return shotSchema.parse(body);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }
    if (typeof body.message === 'string') {
      return body.message;
    }
  } catch {
    // Fall through to status text.
  }

  return response.statusText || `Request failed (${response.status})`;
}
