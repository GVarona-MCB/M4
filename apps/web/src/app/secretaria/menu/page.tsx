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
    <main style={{ maxWidth: 640, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <LogoutButton />
      <h1>Menú del día</h1>

      <fieldset style={{ marginBottom: 20 }}>
        <legend>Agregar opción</legend>
        <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>{' '}
        <input
          placeholder="Descripción del plato"
          value={descripcion}
          maxLength={200}
          onChange={(e) => setDescripcion(e.target.value)}
        />{' '}
        <label>
          <input type="checkbox" checked={lleva} onChange={(e) => setLleva(e.target.checked)} /> lleva
          acompañamiento
        </label>{' '}
        <button onClick={() => void agregar()} disabled={!proveedorId || !descripcion.trim()}>
          Agregar
        </button>
      </fieldset>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {menu.map((g) => (
        <section key={g.proveedorId}>
          <h2>{g.proveedorNombre}</h2>
          <ul>
            {g.opciones.map((o) => (
              <li key={o.id}>
                {o.descripcion}
                {o.llevaAcompanamiento ? ' (con acompañamiento)' : ''}{' '}
                <button onClick={() => void eliminar(o.id)}>Eliminar</button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
