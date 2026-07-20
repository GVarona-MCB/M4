'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { LogoutButton } from '@/components/LogoutButton';

interface MenuOption {
  id: string;
  descripcion: string;
  llevaAcompanamiento: boolean;
}
interface MenuGroup {
  proveedorId: string;
  proveedorNombre: string;
  opciones: MenuOption[];
}
interface Pedido {
  id: string;
  opcionPlatoId: string;
  acompanamiento: string | null;
  estado: 'PENDIENTE' | 'ENVIADO';
}

export default function PedirPage() {
  const [menu, setMenu] = useState<MenuGroup[]>([]);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [opcionId, setOpcionId] = useState('');
  const [acompanamiento, setAcompanamiento] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const opcionElegida = menu.flatMap((g) => g.opciones).find((o) => o.id === opcionId);

  async function load(): Promise<void> {
    setError(null);
    try {
      const [m, p] = await Promise.all([
        apiFetch<MenuGroup[]>('/menu'),
        apiFetch<Pedido | null>('/orders/me'),
      ]);
      setMenu(m);
      setPedido(p);
      if (p) {
        setOpcionId(p.opcionPlatoId);
        setAcompanamiento(p.acompanamiento ?? '');
      }
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(method: 'POST' | 'PATCH'): Promise<void> {
    setError(null);
    setMsg(null);
    try {
      await ensureCsrf();
      await apiFetch('/orders/me', {
        method,
        body: JSON.stringify({ opcionPlatoId: opcionId, acompanamiento: acompanamiento || undefined }),
      });
      setMsg('Pedido guardado.');
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function anular(): Promise<void> {
    setError(null);
    setMsg(null);
    try {
      await ensureCsrf();
      await apiFetch('/orders/me', { method: 'DELETE' });
      setMsg('Pedido anulado.');
      setPedido(null);
      setOpcionId('');
      setAcompanamiento('');
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  const yaEnviado = pedido?.estado === 'ENVIADO';

  return (
    <main className="page max-w-xl">
      <LogoutButton />
      <h1>Mi pedido de hoy</h1>
      {menu.length === 0 && <p className="mt-2 text-slate-600">No hay menú disponible para hoy.</p>}

      <div className="mt-4 flex flex-col gap-3">
        {menu.map((g) => (
          <fieldset key={g.proveedorId} className="rounded-md border border-slate-200 p-4">
            <legend className="px-1 font-semibold">{g.proveedorNombre}</legend>
            <div className="flex flex-col gap-1">
              {g.opciones.map((o) => (
                <label key={o.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="opcion"
                    value={o.id}
                    checked={opcionId === o.id}
                    disabled={yaEnviado}
                    onChange={() => setOpcionId(o.id)}
                  />
                  <span>
                    {o.descripcion}
                    {o.llevaAcompanamiento ? ' (con acompañamiento)' : ''}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {opcionElegida?.llevaAcompanamiento && (
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium">
          Acompañamiento
          <input
            type="text"
            maxLength={100}
            value={acompanamiento}
            disabled={yaEnviado}
            onChange={(e) => setAcompanamiento(e.target.value)}
            className="field font-normal"
          />
        </label>
      )}

      {msg && <p className="msg-ok">{msg}</p>}
      {error && <p className="msg-error">{error}</p>}

      <div className="mt-5 flex gap-2">
        {yaEnviado ? (
          <p className="text-slate-600">Tu pedido ya fue enviado al proveedor y no puede modificarse.</p>
        ) : pedido ? (
          <>
            <button onClick={() => void submit('PATCH')} disabled={!opcionId} className="btn btn-primary">
              Actualizar pedido
            </button>
            <button onClick={() => void anular()} className="btn btn-danger">
              Anular pedido
            </button>
          </>
        ) : (
          <button onClick={() => void submit('POST')} disabled={!opcionId} className="btn btn-primary">
            Confirmar pedido
          </button>
        )}
      </div>
    </main>
  );
}
