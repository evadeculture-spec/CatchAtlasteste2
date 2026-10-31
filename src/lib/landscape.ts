// Ilustrações de paisagem de albufeira geradas em SVG.
// Usadas como "composição visual alternativa" quando não há fotografia do utilizador.
// O mesmo SVG serve para <img> e para desenhar no canvas do cartão de história.

interface Palette {
  sky: [string, string, string];
  sun: string;
  sunY: number;
  sunX: number;
  sunR: number;
  far: string;
  mid: string;
  near: string;
  water: [string, string];
  mist: number;
  flat?: boolean;
  moon?: boolean;
}

const PALETTES: Record<string, Palette> = {
  dawn: {
    sky: ['#17344a', '#5f7f8f', '#f0b27a'],
    sun: '#ffe0a8',
    sunX: 780,
    sunY: 520,
    sunR: 46,
    far: '#6f8a92',
    mid: '#3f6158',
    near: '#1d3b31',
    water: ['#d49c6c', '#122f3f'],
    mist: 0.35,
  },
  day: {
    sky: ['#5f9fc4', '#a9cfe0', '#e6f0ee'],
    sun: '#fffbe8',
    sunX: 300,
    sunY: 170,
    sunR: 40,
    far: '#8eaaa6',
    mid: '#4f7a5c',
    near: '#245446',
    water: ['#a6c8d0', '#1d4556'],
    mist: 0.12,
  },
  dusk: {
    sky: ['#1f2342', '#7a4d68', '#f59a62'],
    sun: '#ffc27a',
    sunX: 420,
    sunY: 535,
    sunR: 54,
    far: '#5e5470',
    mid: '#3a3b52',
    near: '#1b2233',
    water: ['#e0905f', '#101a2a'],
    mist: 0.18,
  },
  mist: {
    sky: ['#aebfbe', '#d4dedb', '#f1f3ef'],
    sun: '#ffffff',
    sunX: 640,
    sunY: 330,
    sunR: 60,
    far: '#a9b9b4',
    mid: '#7d968c',
    near: '#47665a',
    water: ['#cfdad6', '#5d7a78'],
    mist: 0.7,
  },
  plain: {
    sky: ['#6aa6c9', '#b9d7e3', '#f5e6c6'],
    sun: '#fff6dc',
    sunX: 900,
    sunY: 240,
    sunR: 38,
    far: '#a7ad8e',
    mid: '#7f8d62',
    near: '#4e6342',
    water: ['#9fc4cf', '#20495a'],
    mist: 0.1,
    flat: true,
  },
  night: {
    sky: ['#06131c', '#123049', '#2e5568'],
    sun: '#e8f0f2',
    sunX: 860,
    sunY: 190,
    sunR: 26,
    far: '#24404c',
    mid: '#17303a',
    near: '#0c1c24',
    water: ['#2a4c5c', '#050e14'],
    mist: 0.15,
    moon: true,
  },
};

export const ART_VARIANTS = Object.keys(PALETTES);

const W = 1200;
const H = 900;
const HORIZON = 560;

function rand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function ridge(r: () => number, base: number, amp: number, freq: number) {
  const p1 = r() * Math.PI * 2;
  const p2 = r() * Math.PI * 2;
  const pts: string[] = [];
  const ys: number[] = [];
  for (let x = 0; x <= W; x += 20) {
    const y =
      base -
      amp * (0.6 + 0.4 * Math.sin((x / W) * Math.PI * freq + p1)) * (0.75 + 0.25 * Math.sin((x / W) * Math.PI * freq * 2.7 + p2));
    ys.push(y);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return { d: `M0,${HORIZON} L${pts.join(' L')} L${W},${HORIZON} Z`, ys };
}

function trees(r: () => number, ys: number[], color: string) {
  let out = '';
  for (let i = 0; i < ys.length; i++) {
    if (r() < 0.55) continue;
    const x = i * 20 + r() * 12;
    const y = ys[i] + 4;
    const h = 14 + r() * 22;
    const w = h * 0.42;
    out += `<path d="M${x.toFixed(1)},${(y - h).toFixed(1)} L${(x + w / 2).toFixed(1)},${y.toFixed(1)} L${(x - w / 2).toFixed(1)},${y.toFixed(1)} Z" fill="${color}"/>`;
  }
  return out;
}

export function landscapeSvg(variant: string, seed = 7): string {
  const p = PALETTES[variant] ?? PALETTES.dawn;
  const r = rand(seed * 9973 + variant.length * 31);
  const flat = p.flat ? 0.45 : 1;
  const far = ridge(r, HORIZON - 30, 150 * flat, 1.6);
  const mid = ridge(r, HORIZON - 4, 95 * flat, 2.4);
  const near = ridge(r, HORIZON + 2, 55 * flat, 3.4);
  const nearTrees = trees(r, near.ys, p.near);
  const midTrees = p.flat ? '' : trees(r, mid.ys, p.mid);
  const hills = `
    <path d="${far.d}" fill="${p.far}"/>
    <path d="${mid.d}" fill="${p.mid}"/>${midTrees}
    <path d="${near.d}" fill="${p.near}"/>${nearTrees}`;
  let stars = '';
  if (p.moon) {
    for (let i = 0; i < 70; i++) {
      stars += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 380).toFixed(0)}" r="${(r() * 1.6 + 0.4).toFixed(1)}" fill="#fff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
    }
  }
  let ripples = '';
  for (let i = 0; i < 26; i++) {
    const y = HORIZON + 12 + Math.pow(r(), 1.6) * (H - HORIZON - 20);
    const len = 30 + r() * 140 * ((y - HORIZON) / (H - HORIZON) + 0.3);
    const x = r() * W;
    ripples += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${len.toFixed(0)}" height="${(1 + (y - HORIZON) / 140).toFixed(1)}" rx="1" fill="#fff" opacity="${(0.05 + r() * 0.12).toFixed(2)}"/>`;
  }
  let glints = '';
  for (let i = 0; i < 14; i++) {
    const y = HORIZON + 8 + i * 18 + r() * 8;
    const w = (60 - i * 2.5) * (0.6 + r() * 0.8);
    glints += `<rect x="${(p.sunX - w / 2 + (r() - 0.5) * 30).toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="3" rx="1.5" fill="${p.sun}" opacity="${(0.55 - i * 0.03).toFixed(2)}"/>`;
  }
  const sunVisible = p.sunY < HORIZON;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.sky[0]}"/><stop offset=".62" stop-color="${p.sky[1]}"/><stop offset="1" stop-color="${p.sky[2]}"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.water[0]}"/><stop offset="1" stop-color="${p.water[1]}"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${p.sun}" stop-opacity=".75"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>
    <filter id="blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
  <rect width="${W}" height="${HORIZON}" fill="url(#sky)"/>
  ${stars}
  ${sunVisible ? `<circle cx="${p.sunX}" cy="${p.sunY}" r="${p.sunR * 5}" fill="url(#glow)"/><circle cx="${p.sunX}" cy="${p.sunY}" r="${p.sunR}" fill="${p.sun}"/>` : ''}
  ${hills}
  <rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#water)"/>
  <g transform="translate(0 ${HORIZON * 2}) scale(1 -1)" opacity=".38" filter="url(#soft)">${hills}</g>
  ${sunVisible ? glints : ''}
  ${ripples}
  <rect x="-100" y="${HORIZON - 70}" width="${W + 200}" height="120" fill="#fff" opacity="${p.mist}" filter="url(#blur)"/>
  <rect x="200" y="${HORIZON + 30}" width="700" height="60" fill="#fff" opacity="${(p.mist * 0.6).toFixed(2)}" filter="url(#blur)"/>
</svg>`;
}

const cache = new Map<string, string>();
export function landscapeDataUrl(variant: string, seed = 7): string {
  const key = `${variant}:${seed}`;
  let url = cache.get(key);
  if (!url) {
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(landscapeSvg(variant, seed))}`;
    cache.set(key, url);
  }
  return url;
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Ilustração determinística para uma jornada sem fotografia. */
export function artForId(id: string): string {
  const variants = ['dawn', 'mist', 'dusk', 'day', 'plain', 'night'];
  return `art:${variants[hashString(id) % variants.length]}`;
}
