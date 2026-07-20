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

  // Sesión expirada o inválida: volver al login (FR-005).
  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/')) {
    window.location.href = '/login';
  }

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

  // Respuesta OK sin cuerpo: 204, o 200 con cuerpo vacío (p. ej. GET /orders/me
  // cuando el empleado aún no tiene pedido → el contrato lo define como "vacío").
  // Evita "Unexpected end of JSON input" al parsear un cuerpo inexistente.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Obtiene un token CSRF antes de operaciones que cambian estado. */
export async function ensureCsrf(): Promise<void> {
  await apiFetch('/auth/csrf');
}

/** Cierra la sesión manualmente (FR-031) y vuelve al login. */
export async function logout(): Promise<void> {
  await ensureCsrf();
  await apiFetch('/auth/logout', { method: 'POST' });
  if (typeof window !== 'undefined') window.location.href = '/login';
}
