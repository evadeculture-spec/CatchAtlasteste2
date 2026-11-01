// Formatação em português de Portugal.

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function nowTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** "19 de outubro de 2026" */
export function formatDateLong(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "sábado, 7 nov" */
export function formatDateShort(iso: string, withWeekday = true): string {
  const d = parseISODate(iso);
  const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  return withWeekday ? `${WEEKDAYS[d.getDay()]}, ${base}` : `${base} ${d.getFullYear()}`;
}

export function formatWeekday(iso: string): string {
  return WEEKDAYS[parseISODate(iso).getDay()];
}

export function daysUntil(iso: string): number {
  const today = parseISODate(todayISO());
  return Math.round((parseISODate(iso).getTime() - today.getTime()) / 86400000);
}

export function relativeDay(iso: string): string {
  const n = daysUntil(iso);
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanhã';
  if (n === -1) return 'Ontem';
  if (n > 1) return `Daqui a ${n} dias`;
  return `Há ${-n} dias`;
}

const nf1 = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 });
export const formatNumber = (n: number) => nf1.format(n);
export const formatKg = (n: number) => `${nf1.format(n)} kg`;
export const formatCm = (n: number) => `${nf1.format(n)} cm`;
export const formatM = (n: number) => `${nf1.format(n)} m`;

/** Aceita "1,2" ou "1.2". Devolve undefined para vazio e NaN para inválido. */
export function parseDecimal(v: string): number | undefined {
  const t = v.trim().replace(',', '.');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

export function listPt(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function timeOf(dateTime: string): string {
  return dateTime.split('T')[1]?.slice(0, 5) ?? '';
}
export function dateOf(dateTime: string): string {
  return dateTime.split('T')[0] ?? '';
}
