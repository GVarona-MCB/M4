'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { AppShell } from '@/components/AppShell';

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
    <AppShell>
      <h1>Depuración</h1>
      <p className="mt-1 text-slate-600">La depuración automática corre todos los días a las 15:00 (GMT-3).</p>
      <button onClick={() => void ejecutar()} className="btn btn-primary mt-4">
        Ejecutar depuración manual
      </button>
      {msg && <p className="msg-ok">{msg}</p>}
      {error && <p className="msg-error">{error}</p>}

      <h2>Historial</h2>
      <div className="panel overflow-x-auto p-2">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha/hora</th>
              <th>Tipo</th>
              <th>Resultado</th>
              <th>Intentos</th>
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
      </div>
    </AppShell>
  );
}
