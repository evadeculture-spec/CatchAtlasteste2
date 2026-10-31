// Condições DEMONSTRATIVAS. Não são uma previsão meteorológica.
// Valores gerados de forma determinística (local + data) dentro de intervalos
// sazonais plausíveis para Portugal continental. O nascer/pôr do sol é um
// cálculo astronómico aproximado.
import { hashString } from './landscape';
import { parseISODate } from './format';

export interface DemoConditions {
  tempMin: number;
  tempMax: number;
  tempAtStart: number;
  windKmh: number;
  windDir: string;
  precipMm: number;
  sky: string;
  sunrise: string;
  sunset: string;
}

const MAX_BY_MONTH = [14, 16, 19, 21, 24, 29, 32, 32, 29, 23, 17, 14];
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

const rad = Math.PI / 180;

/** Equação do nascer do sol (aproximação). Devolve horas locais de Lisboa. */
export function sunTimes(dateISO: string, lat: number, lon: number): { sunrise: string; sunset: string } {
  const d = parseISODate(dateISO);
  const utcMidnight = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const jd = utcMidnight / 86400000 + 2440587.5;
  const n = Math.ceil(jd - 2451545.0 + 0.0008);
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const sinDec = Math.sin(lambda * rad) * Math.sin(23.44 * rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * sinDec) / (Math.cos(lat * rad) * cosDec);
  const w = (Math.acos(Math.max(-1, Math.min(1, cosW))) / rad) / 360;
  const toLocal = (j: number) =>
    new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon' }).format(
      new Date((j - 2440587.5) * 86400000),
    );
  return { sunrise: toLocal(jTransit - w), sunset: toLocal(jTransit + w) };
}

export function demoConditions(
  key: string,
  dateISO: string,
  startTime: string,
  lat = 39.4,
  lon = -8.2,
): DemoConditions {
  const r = seeded(hashString(`${key}|${dateISO}`));
  const month = parseISODate(dateISO).getMonth();
  const tempMax = Math.round(MAX_BY_MONTH[month] + (r() - 0.5) * 6);
  const tempMin = Math.round(tempMax - 8 - r() * 5);
  const hour = Number(startTime.split(':')[0] ?? 8);
  // curva diária simples: mínimo ~6h, máximo ~15h
  const f = Math.max(0, Math.min(1, (hour - 6) / 9));
  const tempAtStart = Math.round(tempMin + (tempMax - tempMin) * Math.sin((f * Math.PI) / 2));
  const windKmh = Math.round(4 + r() * 22);
  const windDir = DIRS[Math.floor(r() * DIRS.length)];
  const wet = r();
  const wetSeason = month >= 9 || month <= 3;
  const precipMm = wet > (wetSeason ? 0.6 : 0.88) ? Math.round(r() * 60) / 10 : 0;
  const sky = precipMm > 0 ? 'Aguaceiros fracos' : r() > 0.55 ? 'Pouco nublado' : 'Céu limpo';
  const { sunrise, sunset } = sunTimes(dateISO, lat, lon);
  return { tempMin, tempMax, tempAtStart, windKmh, windDir, precipMm, sky, sunrise, sunset };
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
