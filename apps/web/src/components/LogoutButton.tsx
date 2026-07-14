'use client';

import { logout } from '@/lib/api-client';

export function LogoutButton() {
  return (
    <button onClick={() => void logout()} style={{ float: 'right' }}>
      Cerrar sesión
    </button>
  );
}
