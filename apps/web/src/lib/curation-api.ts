import type { Shot } from '@signets/shared';

import { shotSchema } from '@signets/shared';

import { getCurationToken } from './curation-token';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function deleteShot(id: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/shots/${id}`, {
    headers: authHeaders(),
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function toggleShotFavorite(id: string): Promise<Shot> {
  const response = await fetch(`${apiBaseUrl}/shots/${id}/favorite`, {
    headers: authHeaders(),
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const body: unknown = await response.json();
  return shotSchema.parse(body);
}

function authHeaders(): HeadersInit {
  const token = getCurationToken();
  if (!token) {
    throw new Error('Sync token is not configured.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
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
