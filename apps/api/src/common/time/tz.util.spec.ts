import { businessDay, isAfterCutoff, isWeekend } from './tz.util';

describe('tz.util (GMT-3, FR-032)', () => {
  it('detecta fin de semana en GMT-3', () => {
    expect(isWeekend(new Date('2026-07-18T12:00:00-03:00'))).toBe(true); // sábado
    expect(isWeekend(new Date('2026-07-19T12:00:00-03:00'))).toBe(true); // domingo
    expect(isWeekend(new Date('2026-07-14T12:00:00-03:00'))).toBe(false); // martes
  });

  it('corta a las 13:00 inclusive (13:00:00 ya está cerrado)', () => {
    expect(isAfterCutoff(new Date('2026-07-14T12:59:59-03:00'))).toBe(false);
    expect(isAfterCutoff(new Date('2026-07-14T13:00:00-03:00'))).toBe(true);
    expect(isAfterCutoff(new Date('2026-07-14T13:30:00-03:00'))).toBe(true);
  });

  it('el "día" operativo se calcula en GMT-3, no en UTC', () => {
    // 01:00Z del 15 = 22:00 GMT-3 del 14 → sigue siendo el día 14
    expect(businessDay(new Date('2026-07-15T01:00:00Z'))).toBe('2026-07-14');
    expect(businessDay(new Date('2026-07-14T23:30:00-03:00'))).toBe('2026-07-14');
  });
});
