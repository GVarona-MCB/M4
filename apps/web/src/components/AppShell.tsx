import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

// Layout de las pantallas con sesión: header global + contenido centrado + footer.
// showHome=false en la propia home (oculta el botón "Inicio" del header).
export function AppShell({ children, showHome = true }: { children: ReactNode; showHome?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader showHome={showHome} />
      <main className="page flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Vianda · App interna de pedido de almuerzo
        </div>
      </footer>
    </div>
  );
}
