import type { ReactNode } from 'react';

export const metadata = {
  title: 'Vianda — Pedido de almuerzo',
  description: 'App interna de pedido de almuerzo',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
