'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { AppShell } from '@/components/AppShell';

interface Proveedor {
  id: string;
  nombre: string;
  correoDestino: string;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setError(null);
    try {
      setProveedores(await apiFetch<Proveedor[]>('/providers'));
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function crear(): Promise<void> {
    setError(null);
    try {
      await ensureCsrf();
      await apiFetch('/providers', {
        method: 'POST',
        body: JSON.stringify({ nombre, correoDestino: correo }),
      });
      setNombre('');
      setCorreo('');
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function eliminar(id: string): Promise<void> {
    setError(null);
    try {
      await ensureCsrf();
      await apiFetch(`/providers/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  return (
    <AppShell>
      <h1>Proveedores</h1>
      <p className="mt-1 text-slate-600">La cantidad de proveedores la determinás vos.</p>

      <fieldset className="fieldset mt-4">
        <legend>Agregar proveedor</legend>
        <input className="field" placeholder="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input
          className="field"
          placeholder="correo de destino"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <button onClick={() => void crear()} disabled={!nombre || !correo} className="btn btn-primary">
          Agregar
        </button>
      </fieldset>

      {error && <p className="msg-error">{error}</p>}

      <ul className="mt-4 flex flex-col divide-y divide-slate-100">
        {proveedores.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              <strong className="font-semibold">{p.nombre}</strong>{' '}
              <span className="text-slate-600">— {p.correoDestino}</span>
            </span>
            <button onClick={() => void eliminar(p.id)} className="btn btn-danger btn-sm">
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
