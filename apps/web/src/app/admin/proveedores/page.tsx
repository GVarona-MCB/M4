'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { LogoutButton } from '@/components/LogoutButton';

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
    <main style={{ maxWidth: 640, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <LogoutButton />
      <h1>Proveedores</h1>
      <p>La cantidad de proveedores la determinás vos.</p>

      <fieldset style={{ marginBottom: 20 }}>
        <legend>Agregar proveedor</legend>
        <input placeholder="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />{' '}
        <input
          placeholder="correo de destino"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />{' '}
        <button onClick={() => void crear()} disabled={!nombre || !correo}>
          Agregar
        </button>
      </fieldset>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <ul>
        {proveedores.map((p) => (
          <li key={p.id}>
            <strong>{p.nombre}</strong> — {p.correoDestino}{' '}
            <button onClick={() => void eliminar(p.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
