// Geração LOCAL de narrativa a partir de modelos de texto.
// Regra de ouro: só usa dados efetivamente registados. Nunca inventa capturas,
// pesos, condições, emoções ou acontecimentos.
import type { Catch, Journey } from '../types';
import { MODALITIES, speciesById, spotById } from '../data/constants';
import { formatCm, formatDateLong, formatKg, formatM, formatWeekday, listPt, timeOf } from './format';

export const NARRATIVE_VARIANTS = ['Diário', 'Crónica', 'Essencial'] as const;

function countSpecies(catches: Catch[]): string {
  const counts = new Map<string, number>();
  for (const c of catches) counts.set(c.species, (counts.get(c.species) ?? 0) + 1);
  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => {
      const s = speciesById(id);
      if (!s) return `${n}`;
      return n === 1 ? `${s.article} ${s.name}` : `${n} ${s.plural}`;
    });
  return listPt(parts);
}

function catchDetail(c: Catch): string {
  const s = speciesById(c.species);
  const name = s ? `${s.article} ${s.name}` : 'um peixe';
  const measures: string[] = [];
  if (c.weightKg) measures.push(formatKg(c.weightKg));
  if (c.lengthCm) measures.push(formatCm(c.lengthCm));
  let t = name + (measures.length ? ` de ${listPt(measures)}` : '');
  const time = timeOf(c.dateTime);
  if (time) t += `, às ${time}`;
  const how: string[] = [];
  if (c.technique) how.push(`em ${c.technique.toLowerCase()}`);
  const lureBits = [c.lure, c.color ? `cor ${c.color}` : ''].filter(Boolean).join(', ');
  if (lureBits) how.push(`com ${lureBits}`);
  if (how.length) t += `, ${how.join(' ')}`;
  if (c.depthM) t += `, a cerca de ${formatM(c.depthM)} de profundidade`;
  return t;
}

function locationOf(j: Journey): string {
  return spotById(j.spotId)?.name ?? j.locationName ?? '';
}

function sentenceCase(s: string) {
  const t = s.trim();
  if (!t) return t;
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…»"]$/.test(cap) ? cap : `${cap}.`;
}

export function generateNarrative(j: Journey, catches: Catch[], variant = 0): string {
  const place = locationOf(j);
  const date = formatDateLong(j.date);
  const weekday = formatWeekday(j.date);
  const modality = MODALITIES.find((m) => m.id === j.modality)?.short;
  const target = speciesById(j.targetSpecies);
  const sorted = [...catches].sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const weighted = sorted.filter((c) => c.weightKg);
  const best = weighted.sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))[0];
  const released = catches.filter((c) => c.released).length;
  const time = j.startTime ? (j.endTime ? `entre as ${j.startTime} e as ${j.endTime}` : `a partir das ${j.startTime}`) : '';

  const p: string[] = [];
  const v = ((variant % 3) + 3) % 3;

  // Abertura
  if (v === 0) {
    p.push(sentenceCase(`${date}${place ? `, ${place}` : ''}`));
    const bits = [modality ? `Pesquei ${modality}` : '', time].filter(Boolean).join(', ');
    if (bits) p.push(sentenceCase(bits));
  } else if (v === 1) {
    const prep = weekday === 'sábado' || weekday === 'domingo' ? 'No' : 'Na';
    p.push(sentenceCase(`${prep} ${weekday}, ${date}${place ? `, a jornada levou-me a ${place}` : ''}`));
    if (modality || time) p.push(sentenceCase([modality ? `Fui ${modality}` : 'Estive na água', time].filter(Boolean).join(' ')));
  } else {
    p.push(sentenceCase(`${place || 'Jornada'} · ${date}`));
  }

  if (target) {
    p.push(v === 2 ? sentenceCase(`Objetivo: ${target.name}`) : sentenceCase(`O objetivo era ${target.article === 'um' ? 'o' : 'a'} ${target.name}`));
  }
  if (j.techniques.length && v !== 2) {
    p.push(sentenceCase(`No plano levava ${listPt(j.techniques.map((t) => t.toLowerCase()))}`));
  }

  // Capturas
  if (sorted.length === 0) {
    p.push(v === 2 ? 'Sem capturas registadas.' : 'Não registei capturas nesta jornada.');
  } else if (sorted.length === 1) {
    p.push(sentenceCase(`Registei uma captura: ${catchDetail(sorted[0])}`));
  } else {
    p.push(sentenceCase(`Registei ${sorted.length} capturas: ${countSpecies(sorted)}`));
    if (best) p.push(sentenceCase(`A maior foi ${catchDetail(best)}`));
  }
  if (sorted.length > 0 && released > 0) {
    p.push(
      released === sorted.length
        ? sorted.length === 1
          ? 'Foi devolvida à água.'
          : 'Todas foram devolvidas à água.'
        : `${released} ${released === 1 ? 'foi devolvida' : 'foram devolvidas'} à água.`,
    );
  }

  // Notas e aprendizagens — citadas tal como escritas
  const note = (j.summary || j.notes || '').trim();
  if (note) p.push(v === 2 ? `Nota: «${note}»` : `Das minhas notas: «${note}»`);
  if (j.learnings?.trim()) p.push(v === 2 ? `Aprendizagem: «${j.learnings.trim()}»` : `Para a próxima: «${j.learnings.trim()}»`);

  return p.join(v === 2 ? '\n' : ' ');
}
