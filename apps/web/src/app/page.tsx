'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, type ApiError } from '@/lib/api-client';
import { LogoutButton } from '@/components/LogoutButton';

interface Me {
  id: string;
  nombre: string;
  rol: 'ADMIN' | 'SECRETARIA' | 'EMPLEADO';
}

interface NavItem {
  href: string;
  label: string;
  desc: string;
}

// Registrar el pedido es transversal a los tres roles (RF-14). Secretaría y
// Administrador suman sus funciones propias además de "Mi pedido".
const COMUN: NavItem[] = [
  { href: '/pedir', label: 'Mi pedido de hoy', desc: 'Elegir plato del menú del día.' },
];
const POR_ROL: Record<Me['rol'], NavItem[]> = {
  EMPLEADO: [],
  SECRETARIA: [
    { href: '/secretaria/menu', label: 'Menú del día', desc: 'Cargar y editar los menús por proveedor.' },
    { href: '/secretaria/consolidado', label: 'Consolidar y enviar', desc: 'Ver pedidos por proveedor y enviarlos.' },
  ],
  ADMIN: [
    { href: '/admin/usuarios', label: 'Usuarios y roles', desc: 'Alta, edición y estado de usuarios.' },
    { href: '/admin/proveedores', label: 'Proveedores', desc: 'Gestionar proveedores y su correo.' },
    { href: '/admin/depuracion', label: 'Depuración', desc: 'Ejecutar la depuración manual del día.' },
  ],
};

const ROL_LABEL: Record<Me['rol'], string> = {
  ADMIN: 'Administrador',
  SECRETARIA: 'Secretaría',
  EMPLEADO: 'Empleado',
};

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setMe(await apiFetch<Me>('/auth/me'));
      } catch (err) {
        // Sin sesión válida: /auth/me responde 401 (el cliente no redirige solo
        // en rutas /auth/*, para no ciclar en el login). Vamos al login a mano.
        if ((err as ApiError).status === 401 && typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    })();
  }, []);

  if (!me) {
    return <main style={{ maxWidth: 560, margin: '2rem auto', fontFamily: 'system-ui' }}>Cargando…</main>;
  }

  const items = [...COMUN, ...POR_ROL[me.rol]];

  return (
    <main style={{ maxWidth: 560, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <LogoutButton showHome={false} />
      <h1>Vianda</h1>
      <p>
        Hola, <strong>{me.nombre}</strong> · {ROL_LABEL[me.rol]}
      </p>
      <nav>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            style={{
              display: 'block',
              padding: '12px 14px',
              marginBottom: 10,
              border: '1px solid #ccc',
              borderRadius: 6,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <strong>{it.label}</strong>
            <br />
            <span style={{ color: '#666', fontSize: 14 }}>{it.desc}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
