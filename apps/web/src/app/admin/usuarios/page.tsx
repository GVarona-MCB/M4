'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ensureCsrf, type ApiError } from '@/lib/api-client';
import { LogoutButton } from '@/components/LogoutButton';

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
    <main style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <LogoutButton />
      <h1>Usuarios</h1>

      <fieldset style={{ marginBottom: 20 }}>
        <legend>Crear usuario</legend>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />{' '}
        <input placeholder="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />{' '}
        <select value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
          <option value="EMPLEADO">Empleado</option>
          <option value="SECRETARIA">Secretaría</option>
          <option value="ADMIN">Administrador</option>
        </select>{' '}
        <input
          placeholder="contraseña (≥6)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />{' '}
        <button
          onClick={() => void crear()}
          disabled={!email || !nombre || password.length < 6}
        >
          Crear
        </button>
      </fieldset>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Email</th>
            <th style={{ textAlign: 'left' }}>Nombre</th>
            <th style={{ textAlign: 'left' }}>Rol</th>
            <th style={{ textAlign: 'left' }}>Estado</th>
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
                <button onClick={() => void toggleActivo(u)}>
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
