'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { AppShell } from '@/components/AppShell';

type Rol = 'ADMIN' | 'SECRETARIA' | 'EMPLEADO';
interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<Rol>('EMPLEADO');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setError(null);
    try {
      setUsuarios(await apiFetch<Usuario[]>('/users'));
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
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ email, nombre, rol, password }),
      });
      setEmail('');
      setNombre('');
      setPassword('');
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  async function toggleActivo(u: Usuario): Promise<void> {
    setError(null);
    try {
      await ensureCsrf();
      await apiFetch(`/users/${u.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !u.activo }),
      });
      await load();
    } catch (err) {
      setError((err as ApiError).message);
    }
  }

  return (
    <AppShell>
      <h1>Usuarios</h1>

      <fieldset className="fieldset mt-4">
        <legend>Crear usuario</legend>
        <input className="field" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" placeholder="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <select className="field" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
          <option value="EMPLEADO">Empleado</option>
          <option value="SECRETARIA">Secretaría</option>
          <option value="ADMIN">Administrador</option>
        </select>
        <input
          className="field"
          placeholder="contraseña (≥6)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={() => void crear()}
          disabled={!email || !nombre || password.length < 6}
          className="btn btn-primary"
        >
          Crear
        </button>
      </fieldset>

      {error && <p className="msg-error">{error}</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.nombre}</td>
                <td>{u.rol}</td>
                <td>{u.activo ? 'activo' : 'inactivo'}</td>
                <td>
                  <button onClick={() => void toggleActivo(u)} className="btn btn-secondary btn-sm">
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
