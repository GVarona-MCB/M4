'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { LogoutButton } from '@/components/LogoutButton';

interface Registro {
  id: string;
  tipo: 'AUTOMATICA' | 'MANUAL';
  resultado: 'EXITO' | 'FALLO';
  intentos: number;
  ejecutadoAt: string;
}

export default function DepuracionPage() {
  const [historial, setHistorial] = useState<Registro[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setError(null);
    try {
      setHistorial(await apiFetch<Registro[]>('/purge/history'));
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function ejecutar(): Promise<void> {
    setError(null);
    setMsg(null);
    try {
      await ensureCsrf();
      const r = await apiFetch<Registro>('/purge', { method: 'POST' });
      setMsg(`Depuración manual: ${r.resultado} (${r.intentos} intento/s).`);
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <LogoutButton />
      <h1>Depuración</h1>
      <p>La depuración automática corre todos los días a las 15:00 (GMT-3).</p>
      <button onClick={() => void ejecutar()}>Ejecutar depuración manual</button>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <h2>Historial</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Fecha/hora</th>
            <th style={{ textAlign: 'left' }}>Tipo</th>
            <th style={{ textAlign: 'left' }}>Resultado</th>
            <th style={{ textAlign: 'left' }}>Intentos</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.ejecutadoAt).toLocaleString('es-AR')}</td>
              <td>{r.tipo}</td>
              <td>{r.resultado}</td>
              <td>{r.intentos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
