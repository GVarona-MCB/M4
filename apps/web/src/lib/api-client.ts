// Cliente HTTP del front: envía la cookie de sesión (credentials) y el header CSRF
// en operaciones que cambian estado (T023, FR-035).

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  if (!['GET', 'HEAD'].includes(method)) {
    headers.set('content-type', 'application/json');
    const csrf = getCookie('csrf');
    if (csrf) headers.set('x-csrf-token', csrf);
  }

  const res = await fetch(`${API}${path}`, { ...options, headers, credentials: 'include' });

  if (!res.ok) {
    let code = 'error';
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: { code?: string; message?: string } };
      if (body.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? message;
      }
    } catch {
      // respuesta sin cuerpo JSON
    }
    const err: ApiError = { status: res.status, code, message };
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Obtiene un token CSRF antes de operaciones que cambian estado. */
export async function ensureCsrf(): Promise<void> {
  await apiFetch('/auth/csrf');
}
