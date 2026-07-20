import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

// Layout de las pantallas con sesión: header global + contenido centrado.
// showHome=false en la propia home (oculta el botón "Inicio" del header).
export function AppShell({ children, showHome = true }: { children: ReactNode; showHome?: boolean }) {
  return (
    <>
      <AppHeader showHome={showHome} />
      <main className="page">{children}</main>
    </>
  );
}
