'use client';

import Link from 'next/link';
import { logout } from '@/lib/api-client';

// showHome: enlace de vuelta a la pantalla de inicio. Se oculta en la propia home.
export function LogoutButton({ showHome = true }: { showHome?: boolean }) {
  return (
    <div style={{ float: 'right' }}>
      {showHome && (
        <Link href="/" style={{ marginRight: 12 }}>
          Inicio
        </Link>
      )}
      <button onClick={() => void logout()}>Cerrar sesión</button>
    </div>
  );
}
