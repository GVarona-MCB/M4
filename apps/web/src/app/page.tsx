'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, type ApiError } from '@/lib/api-client';
import { AppShell } from '@/components/AppShell';

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
    return (
      <AppShell showHome={false}>
        <p className="text-slate-600">Cargando…</p>
      </AppShell>
    );
  }

  const items = [...COMUN, ...POR_ROL[me.rol]];

  return (
    <AppShell showHome={false}>
      <h1>Hola, {me.nombre.split(' ')[0]}</h1>
      <p className="mt-1 text-slate-600">¿Qué querés hacer?</p>
      <nav className="mt-6 flex flex-col gap-2.5">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="block rounded-md border border-slate-200 p-3 hover:bg-slate-50"
          >
            <span className="font-semibold">{it.label}</span>
            <span className="mt-0.5 block text-sm text-slate-600">{it.desc}</span>
          </Link>
        ))}
      </nav>
    </AppShell>
  );
}
