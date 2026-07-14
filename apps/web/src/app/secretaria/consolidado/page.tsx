'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { LogoutButton } from '@/components/LogoutButton';

interface Linea {
  pedidoId: string;
  empleado: string;
  plato: string;
  acompanamiento: string | null;
  estado: string;
}
interface Grupo {
  proveedorId: string;
  proveedorNombre: string;
  pedidos: Linea[];
}

export default function ConsolidadoPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setError(null);
    try {
      setGrupos(await apiFetch<Grupo[]>('/consolidation'));
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function darDeBaja(pedidoId: string): Promise<void> {
    setError(null);
    setMsg(null);
    try {
      await ensureCsrf();
      await apiFetch(`/consolidation/orders/${pedidoId}`, { method: 'DELETE' });
      setMsg('Pedido dado de baja; el empleado puede volver a registrar.');
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function enviar(proveedorId: string): Promise<void> {
    setError(null);
    setMsg(null);
    try {
      await ensureCsrf();
      const r = await apiFetch<{ enviados: number; mensaje: string }>('/consolidation/send', {
        method: 'POST',
        body: JSON.stringify({ proveedorId }),
      });
      setMsg(`${r.mensaje} (${r.enviados} pedidos).`);
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Consolidado de pedidos</h1>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {grupos.length === 0 && <p>No hay pedidos cargados hoy.</p>}
      {grupos.map((g) => (
        <section key={g.proveedorId} style={{ marginBottom: 20 }}>
          <h2>{g.proveedorNombre}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Empleado</th>
                <th style={{ textAlign: 'left' }}>Plato</th>
                <th style={{ textAlign: 'left' }}>Acompañamiento</th>
                <th style={{ textAlign: 'left' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {g.pedidos.map((p) => (
                <tr key={p.pedidoId}>
                  <td>{p.empleado}</td>
                  <td>{p.plato}</td>
                  <td>{p.acompanamiento ?? '—'}</td>
                  <td>{p.estado}</td>
                  <td>
                    {p.estado === 'PENDIENTE' && (
                      <button onClick={() => void darDeBaja(p.pedidoId)}>Dar de baja</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => void enviar(g.proveedorId)} style={{ marginTop: 8 }}>
            Enviar a {g.proveedorNombre}
          </button>
        </section>
      ))}
    </main>
  );
}
