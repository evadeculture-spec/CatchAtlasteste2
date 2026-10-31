import { describe, expect, it } from 'vitest';
import type { Catch, Journey } from '../../types';
import { generateNarrative } from '../narrative';
import { computeStats } from '../stats';

const journey = (p: Partial<Journey> = {}): Journey => ({
  id: 'j1',
  status: 'concluida',
  origin: 'registo',
  locationName: 'Lagoa do Teste',
  locationPrivate: true,
  date: '2026-10-19',
  startTime: '07:00',
  modality: 'margem',
  techniques: [],
  notes: '',
  checklist: {},
  customChecklist: [],
  createdAt: '2026-10-19T00:00:00Z',
  ...p,
});

const fish = (p: Partial<Catch>): Catch => ({
  id: Math.random().toString(36),
  journeyId: 'j1',
  species: 'achiga',
  dateTime: '2026-10-19T08:00',
  technique: '',
  lure: '',
  rig: '',
  color: '',
  notes: '',
  createdAt: '',
  ...p,
});

describe('generateNarrative', () => {
  it('com apenas local, data e uma nota gera um texto simples, sem inventar', () => {
    const t = generateNarrative(journey({ summary: 'Água muito parada.' }), []);
    expect(t).toContain('19 de outubro de 2026');
    expect(t).toContain('Lagoa do Teste');
    expect(t).toContain('«Água muito parada.»');
    expect(t).toContain('Não registei capturas');
    expect(t).not.toMatch(/kg|cm|vento|°C|chuva|feliz|emoç/i);
  });

  it('só refere pesos que existem e escolhe a maior captura', () => {
    const cs = [fish({ weightKg: 1.2 }), fish({ species: 'lucioperca', weightKg: 2.5, lengthCm: 60 }), fish({})];
    const t = generateNarrative(journey(), cs);
    expect(t).toContain('Registei 3 capturas: 2 achigãs e uma lucioperca');
    expect(t).toContain('A maior foi uma lucioperca de 2,5 kg e 60 cm');
    expect(t).not.toContain('devolvid');
  });

  it('todas as variantes usam apenas os dados registados', () => {
    for (let v = 0; v < 3; v++) {
      const t = generateNarrative(journey({ targetSpecies: 'lucio' }), [fish({ species: 'lucio', released: true })], v);
      expect(t).toMatch(/lúcio/);
      expect(t).not.toMatch(/kg/);
    }
  });
});

describe('computeStats', () => {
  it('trata a ausência de dados', () => {
    const s = computeStats([], []);
    expect(s).toMatchObject({ completedJourneys: 0, totalCatches: 0, topSpecies: undefined, bestByWeight: undefined });
  });

  it('deriva os indicadores das capturas das jornadas existentes', () => {
    const s = computeStats(
      [journey(), journey({ id: 'j2', status: 'planeada' })],
      [fish({ weightKg: 1 }), fish({ weightKg: 3, species: 'siluro' }), fish({}), fish({ journeyId: 'apagada', weightKg: 9 })],
    );
    expect(s.completedJourneys).toBe(1);
    expect(s.totalCatches).toBe(3);
    expect(s.topSpecies).toEqual({ id: 'achiga', count: 2 });
    expect(s.bestByWeight?.weightKg).toBe(3);
  });
});
