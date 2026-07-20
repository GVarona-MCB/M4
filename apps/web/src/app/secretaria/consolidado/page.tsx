'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { AppShell } from '@/components/AppShell';

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
    <AppShell>
      <h1>Consolidado de pedidos</h1>
      {msg && <p className="msg-ok">{msg}</p>}
      {error && <p className="msg-error">{error}</p>}
      {grupos.length === 0 && <p className="mt-2 text-slate-600">No hay pedidos cargados hoy.</p>}
      {grupos.map((g) => (
        <section key={g.proveedorId} className="mb-6">
          <h2>{g.proveedorNombre}</h2>
          <div className="panel overflow-x-auto p-2">
            <table className="table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Plato</th>
                  <th>Acompañamiento</th>
                  <th>Estado</th>
                  <th></th>
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
                        <button onClick={() => void darDeBaja(p.pedidoId)} className="btn btn-danger btn-sm">
                          Dar de baja
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => void enviar(g.proveedorId)} className="btn btn-primary mt-3">
            Enviar a {g.proveedorNombre}
          </button>
        </section>
      ))}
    </AppShell>
  );
}
