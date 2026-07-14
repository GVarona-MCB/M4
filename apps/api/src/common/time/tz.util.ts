// Utilidad de zona horaria: todas las reglas de negocio se evalúan en GMT-3
// (America/Argentina/Buenos_Aires, sin DST). FR-032. Timestamps se persisten en UTC.

export const APP_TZ = process.env.APP_TIMEZONE ?? 'America/Argentina/Buenos_Aires';

interface TzParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = domingo ... 6 = sábado
}

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getTzParts(date: Date): TzParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAY[map.weekday] ?? 0,
  };
}

/** Día operativo en GMT-3 como 'YYYY-MM-DD' (la "fecha" del pedido, FR-017/FR-032). */
export function businessDay(date: Date = new Date()): string {
  const p = getTzParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Fecha (medianoche UTC) del día operativo GMT-3, para columnas `@db.Date`. */
export function businessDayDate(date: Date = new Date()): Date {
  return new Date(`${businessDay(date)}T00:00:00.000Z`);
}

/** ¿Es sábado o domingo en GMT-3? (FR-019) */
export function isWeekend(date: Date = new Date()): boolean {
  const wd = getTzParts(date).weekday;
  return wd === 0 || wd === 6;
}

/** ¿Es igual o posterior al corte (13:00 por defecto) en GMT-3? Inclusivo en 13:00:00 (FR-027). */
export function isAfterCutoff(date: Date = new Date(), cutoffHour = 13): boolean {
  return getTzParts(date).hour >= cutoffHour;
}
