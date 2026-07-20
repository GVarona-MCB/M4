'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { LogoutButton } from '@/components/LogoutButton';

interface Proveedor {
  id: string;
  nombre: string;
}
interface Opcion {
  id: string;
  descripcion: string;
  llevaAcompanamiento: boolean;
}
interface Grupo {
  proveedorId: string;
  proveedorNombre: string;
  opciones: Opcion[];
}

export default function MenuAdminPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [menu, setMenu] = useState<Grupo[]>([]);
  const [proveedorId, setProveedorId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lleva, setLleva] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setError(null);
    try {
      const [provs, m] = await Promise.all([
        apiFetch<Proveedor[]>('/providers'),
        apiFetch<Grupo[]>('/menu'),
      ]);
      setProveedores(provs);
      setMenu(m);
      if (!proveedorId && provs.length > 0) setProveedorId(provs[0].id);
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function agregar(): Promise<void> {
    setError(null);
    try {
      await ensureCsrf();
      await apiFetch('/menu/options', {
        method: 'POST',
        body: JSON.stringify({ proveedorId, descripcion, llevaAcompanamiento: lleva }),
      });
      setDescripcion('');
      setLleva(false);
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function eliminar(id: string): Promise<void> {
    setError(null);
    try {
      await ensureCsrf();
      await apiFetch(`/menu/options/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  return (
    <main className="page max-w-2xl">
      <LogoutButton />
      <h1>Menú del día</h1>

      <fieldset className="fieldset mt-4">
        <legend>Agregar opción</legend>
        <select className="field" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <input
          className="field"
          placeholder="Descripción del plato"
          value={descripcion}
          maxLength={200}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lleva} onChange={(e) => setLleva(e.target.checked)} /> lleva
          acompañamiento
        </label>
        <button onClick={() => void agregar()} disabled={!proveedorId || !descripcion.trim()} className="btn btn-primary">
          Agregar
        </button>
      </fieldset>

      {error && <p className="msg-error">{error}</p>}

      {menu.map((g) => (
        <section key={g.proveedorId}>
          <h2>{g.proveedorNombre}</h2>
          <ul className="flex flex-col divide-y divide-slate-100">
            {g.opciones.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {o.descripcion}
                  {o.llevaAcompanamiento ? ' (con acompañamiento)' : ''}
                </span>
                <button onClick={() => void eliminar(o.id)} className="btn btn-danger btn-sm">
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
