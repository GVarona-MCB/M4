'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch, logout } from '@/lib/api-client';

type Rol = 'ADMIN' | 'SECRETARIA' | 'EMPLEADO';
interface Me {
  id: string;
  nombre: string;
  rol: Rol;
}

const ROL_LABEL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  SECRETARIA: 'Secretaría',
  EMPLEADO: 'Empleado',
};

// Isologotipo de Vianda: marca (bowl con vapor) + wordmark. Original, sin assets externos.
function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#2563eb" />
      <path d="M5.5 12.5h13a6.5 6.5 0 0 1-13 0Z" fill="#fff" />
      <path d="M4.5 12.5h15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M9.5 5c-.7.7-.7 1.4 0 2.1M14.5 5c-.7.7-.7 1.4 0 2.1"
        stroke="#bfdbfe"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppHeader({ showHome = true }: { showHome?: boolean }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setMe(await apiFetch<Me>('/auth/me'));
      } catch {
        // Sin sesión: cada página maneja su propio 401 (redirige al login).
      }
    })();
  }, []);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="Vianda — inicio">
          <Logo />
          <span className="text-lg font-bold tracking-tight text-slate-900">Vianda</span>
        </Link>

        <div className="flex items-center gap-3">
          {me && (
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-medium text-slate-900">{me.nombre}</div>
              <div className="text-xs text-slate-500">{ROL_LABEL[me.rol]}</div>
            </div>
          )}
          {showHome && (
            <Link href="/" className="btn btn-secondary btn-sm">
              Inicio
            </Link>
          )}
          <button onClick={() => void logout()} className="btn btn-secondary btn-sm">
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
