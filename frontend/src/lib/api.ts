import { useAuth } from '@clerk/react';
import { useCallback, useMemo } from 'react';

export const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787').replace(/\/+$/, '');

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const FILENAME_PATTERN = /^[a-zA-Z0-9._ -]+$/;

export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  completed: number | boolean;
  created_at: string;
}

export interface StoredFile {
  id: number;
  filename: string;
  size: number;
  content_type: string;
  created_at: string;
}

/** The attachments endpoint returns the file row plus when it was attached. `id` is the file id. */
export interface Attachment extends StoredFile {
  attached_at: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isDone(task: Task): boolean {
  return task.completed === true || task.completed === 1;
}

export function useApi() {
  const { getToken } = useAuth();

  const raw = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const token = await getToken();
      if (!token) throw new ApiError('Your session has ended. Sign in again to continue.', 401);

      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${token}`);

      let response: Response;
      try {
        response = await fetch(`${API_URL}${path}`, { ...init, headers });
      } catch {
        throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
      }

      if (!response.ok) {
        let message = `The request failed with status ${response.status}.`;
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // Response body was not JSON; keep the status message.
        }
        throw new ApiError(message, response.status);
      }

      return response;
    },
    [getToken],
  );

  const json = useCallback(
    async <T>(path: string, init?: RequestInit): Promise<T> => {
      const response = await raw(path, init);
      return (await response.json()) as T;
    },
    [raw],
  );

  return useMemo(() => ({ raw, json }), [raw, json]);
}

export type Api = ReturnType<typeof useApi>;
