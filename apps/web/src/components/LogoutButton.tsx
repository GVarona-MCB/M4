'use client';

import Link from 'next/link';
import { logout } from '@/lib/api-client';

// showHome: enlace de vuelta a la pantalla de inicio. Se oculta en la propia home.
export function LogoutButton({ showHome = true }: { showHome?: boolean }) {
  return (
    <div className="float-right flex items-center gap-2">
      {showHome && (
        <Link href="/" className="btn btn-secondary btn-sm">
          Inicio
        </Link>
      )}
      <button onClick={() => void logout()} className="btn btn-secondary btn-sm">
        Cerrar sesión
      </button>
    </div>
  );
}
