// Escape/saneo de texto libre para render seguro (FR-034). Se almacena tal cual;
// se codifica/neutraliza en la salida.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Reemplaza saltos de línea y caracteres de control (< 0x20 y 0x7F) por espacio,
 * previniendo inyección de encabezados/contenido de correo. Colapsa espacios repetidos.
 */
export function neutralizeControl(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    out += code < 0x20 || code === 0x7f ? ' ' : ch;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Para cuerpos HTML: neutraliza control y escapa HTML. */
export function safeHtml(value: string): string {
  return escapeHtml(neutralizeControl(value));
}
