'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await ensureCsrf();
      const user = await apiFetch<{ rol: 'ADMIN' | 'SECRETARIA' | 'EMPLEADO' }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      // El empleado va directo a su pedido; admin y secretaría al menú principal.
      router.push(user.rol === 'EMPLEADO' ? '/pedir' : '/');
    } catch (err) {
      setError((err as ApiError).message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-narrow">
      <h1 className="mb-6 text-2xl font-bold">Vianda — Iniciar sesión</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="field font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="field font-normal"
          />
        </label>
        {error && <p className="msg-error">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary mt-2">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
