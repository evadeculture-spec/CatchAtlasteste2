// Cartão vertical 9:16 (1080×1920) desenhado em canvas, para exportar ou partilhar.
import type { Catch, Journey } from '../types';
import { resolvePhotoUrl } from './photos';
import { formatDateLong, formatKg } from './format';
import { speciesById, spotById, modalityLabel } from '../data/constants';

const CW = 1080;
const CH = 1920;
const FONT = '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Imagem indisponível'));
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const iw = img.naturalWidth || img.width || w;
  const ih = img.naturalHeight || img.height || h;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderStoryCard(j: Journey, catches: Catch[], text: string, photoRef: string): Promise<HTMLCanvasElement> {
  try {
    await Promise.all([document.fonts.load(`700 80px ${FONT}`), document.fonts.load(`400 40px ${FONT}`)]);
  } catch {
    /* usa a fonte do sistema */
  }
  const canvas = document.createElement('canvas');
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d')!;

  // Fundo
  ctx.fillStyle = '#102F40';
  ctx.fillRect(0, 0, CW, CH);
  const url = await resolvePhotoUrl(photoRef);
  if (url) {
    try {
      drawCover(ctx, await loadImage(url), CW, CH * 0.62);
    } catch {
      /* mantém o fundo */
    }
  }
  // Transição para o azul profundo
  const g = ctx.createLinearGradient(0, CH * 0.28, 0, CH * 0.64);
  g.addColorStop(0, 'rgba(16,47,64,0)');
  g.addColorStop(1, 'rgba(16,47,64,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
  const top = ctx.createLinearGradient(0, 0, 0, 320);
  top.addColorStop(0, 'rgba(16,47,64,.55)');
  top.addColorStop(1, 'rgba(16,47,64,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, CW, 320);

  const pad = 84;
  // Marca
  ctx.fillStyle = '#88D653';
  ctx.beginPath();
  ctx.arc(pad + 14, 132, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F3F5F3';
  ctx.font = `600 40px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('CatchAtlas', pad + 46, 134);
  ctx.font = `500 30px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.globalAlpha = 0.85;
  ctx.fillText(formatDateLong(j.date), CW - pad, 134);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Título
  const place = spotById(j.spotId)?.name ?? j.locationName;
  let y = CH * 0.6;
  ctx.font = `700 92px ${FONT}`;
  const titleLines = wrap(ctx, place, CW - pad * 2).slice(0, 2);
  y -= 30 + (titleLines.length - 1) * 100;
  ctx.fillStyle = '#88D653';
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText('A MINHA HISTÓRIA', pad, y - 104);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 92px ${FONT}`;
  for (const l of titleLines) {
    ctx.fillText(l, pad, y);
    y += 100;
  }

  // Indicadores (só dados registados)
  const chips: string[] = [];
  chips.push(catches.length === 0 ? 'Sem capturas' : catches.length === 1 ? '1 captura' : `${catches.length} capturas`);
  const sp = [...new Set(catches.map((c) => speciesById(c.species)?.name).filter(Boolean))] as string[];
  if (sp.length) chips.push(sp.slice(0, 2).join(' · '));
  const best = [...catches].filter((c) => c.weightKg).sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))[0];
  if (best?.weightKg) chips.push(`Maior ${formatKg(best.weightKg)}`);
  else chips.push(modalityLabel(j.modality));
  ctx.font = `600 32px ${FONT}`;
  let x = pad;
  y += 10;
  for (const c of chips) {
    const w = ctx.measureText(c).width + 48;
    if (x + w > CW - pad) break;
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    roundRect(ctx, x, y, w, 66, 33);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#F3F5F3';
    ctx.fillText(c, x + 24, y + 44);
    x += w + 14;
  }
  y += 140;

  // Texto
  ctx.fillStyle = 'rgba(243,245,243,.94)';
  ctx.font = `400 38px ${FONT}`;
  const lh = 56;
  const maxLines = Math.floor((CH - 196 - y) / lh);
  let lines = wrap(ctx, text.trim() || 'Uma jornada registada na CatchAtlas.', CW - pad * 2);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > CW - pad * 2 && last.length) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  for (const l of lines) {
    ctx.fillText(l, pad, y);
    y += lh;
  }

  // Rodapé
  ctx.fillStyle = 'rgba(243,245,243,.18)';
  ctx.fillRect(pad, CH - 170, CW - pad * 2, 2);
  ctx.fillStyle = 'rgba(243,245,243,.75)';
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText('Gera a tua história · CatchAtlas', pad, CH - 108);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao exportar a imagem'))), 'image/png'),
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function storyFilename(j: Journey) {
  const place = (spotById(j.spotId)?.name ?? j.locationName ?? 'jornada')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase();
  return `catchatlas-${place}-${j.date}.png`;
}
