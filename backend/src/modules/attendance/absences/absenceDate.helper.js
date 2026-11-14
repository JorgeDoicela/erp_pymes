/**
 * @file absenceDate.helper.js
 * @description Utilidades de fechas canónicas y cálculo de días calendario en zona horaria Ecuador.
 */

const VACATION_TYPE_KEYS = new Set(['vacaciones', 'vacation']);
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function isVacationType(type) {
  return VACATION_TYPE_KEYS.has(
    String(type || '')
      .trim()
      .toLowerCase()
  );
}

export function parseCanonicalCalendarDate(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    const m = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const probe = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
      if (
        Number.isNaN(probe.getTime()) ||
        probe.getUTCFullYear() !== y ||
        probe.getUTCMonth() !== mo - 1 ||
        probe.getUTCDate() !== d
      ) {
        return null;
      }
      return {
        iso: `${m[1]}-${m[2]}-${m[3]}`,
        utcNoon: probe,
        utcMidnightMs: Date.UTC(y, mo - 1, d),
      };
    }
  }
  const parsed = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  const [y, mo, d] = [parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()];
  const pad = (n) => String(n).padStart(2, '0');
  return {
    iso: `${y}-${pad(mo + 1)}-${pad(d)}`,
    utcNoon: new Date(Date.UTC(y, mo, d, 12, 0, 0)),
    utcMidnightMs: Date.UTC(y, mo, d),
  };
}

export function calculateCalendarDays(startInput, endInput) {
  const start = parseCanonicalCalendarDate(startInput);
  const end = parseCanonicalCalendarDate(endInput);
  if (!start || !end) return 0;
  return Math.max(1, Math.round((end.utcMidnightMs - start.utcMidnightMs) / MS_PER_DAY) + 1);
}

export function getEcuadorTodayIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
