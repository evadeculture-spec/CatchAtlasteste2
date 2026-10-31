// Experiência demonstrativa inicial. Todos os registos estão marcados com `demo: true`
// e aparecem identificados como "Exemplo" na interface.
import type { Catch, Journey } from '../types';
import { addDays, todayISO } from '../lib/format';

export function buildDemo(): { journeys: Journey[]; catches: Catch[] } {
  const today = todayISO();
  const now = new Date().toISOString();
  const base = {
    locationPrivate: true,
    customChecklist: [],
    createdAt: now,
    demo: true,
  };

  const planned: Journey = {
    ...base,
    id: 'demo_j_plan',
    status: 'planeada',
    origin: 'plano',
    spotId: 'castelo-de-bode',
    locationName: 'Castelo de Bode',
    date: addDays(today, 6),
    startTime: '06:45',
    targetSpecies: 'achiga',
    modality: 'float-tube',
    techniques: ['Vinil texano', 'Jerkbait'],
    notes: 'Começar pelas reentrâncias junto à primeira ponte. Levar o colete novo.',
    checklist: { material: true, amostras: true },
  };

  const d1 = addDays(today, -9);
  const j1: Journey = {
    ...base,
    id: 'demo_j_santaclara',
    status: 'concluida',
    origin: 'plano',
    spotId: 'santa-clara',
    locationName: 'Santa Clara',
    date: d1,
    startTime: '07:00',
    endTime: '11:30',
    targetSpecies: 'achiga',
    modality: 'margem',
    techniques: ['Drop shot', 'Vinil texano'],
    notes: '',
    summary: 'Margem tranquila, água clara e muito silêncio.',
    learnings: 'Os toques vieram todos junto às encostas com sombra.',
    checklist: { material: true, amostras: true, seguranca: true, agua: true, documentacao: true },
    coverPhoto: 'art:dusk',
    startedAt: now,
    completedAt: now,
  };

  const d2 = addDays(today, -38);
  const j2: Journey = {
    ...base,
    id: 'demo_j_alqueva',
    status: 'concluida',
    origin: 'plano',
    spotId: 'alqueva',
    locationName: 'Alqueva',
    date: d2,
    startTime: '06:30',
    endTime: '13:00',
    targetSpecies: 'lucioperca',
    modality: 'embarcacao',
    techniques: ['Jig', 'Vinil com cabeça chumbada'],
    notes: '',
    summary: 'Saída com o Rui. Começámos nas pontas das ilhas.',
    learnings: 'Levar mais gramagens de cabeça chumbada para as zonas fundas.',
    checklist: { material: true, amostras: true, seguranca: true, agua: true, documentacao: true },
    coverPhoto: 'art:plain',
    startedAt: now,
    completedAt: now,
  };

  const d3 = addDays(today, -70);
  const j3: Journey = {
    ...base,
    id: 'demo_j_montargil',
    status: 'concluida',
    origin: 'registo',
    spotId: 'montargil',
    locationName: 'Montargil',
    date: d3,
    startTime: '06:15',
    endTime: '10:00',
    targetSpecies: 'achiga',
    modality: 'float-tube',
    techniques: [],
    notes: '',
    summary: 'Nevoeiro cerrado até às nove. Nenhum toque, mas uma manhã bonita.',
    learnings: 'Testar amostras de superfície quando o nevoeiro levantar.',
    checklist: {},
    coverPhoto: 'art:mist',
    startedAt: now,
    completedAt: now,
  };

  const d4 = addDays(today, -400);
  const j4: Journey = {
    ...base,
    id: 'demo_j_bode_ano',
    status: 'concluida',
    origin: 'registo',
    spotId: 'castelo-de-bode',
    locationName: 'Castelo de Bode',
    date: d4,
    startTime: '17:00',
    endTime: '20:15',
    targetSpecies: 'achiga',
    modality: 'margem',
    techniques: ['Spinnerbait'],
    notes: '',
    summary: 'Fim de tarde depois do trabalho.',
    checklist: {},
    coverPhoto: 'art:dawn',
    startedAt: now,
    completedAt: now,
  };

  const c = (p: Omit<Catch, 'createdAt' | 'demo' | 'notes' | 'rig' | 'color' | 'lure'> & Partial<Catch>): Catch => ({
    notes: '',
    rig: '',
    color: '',
    lure: '',
    createdAt: now,
    demo: true,
    ...p,
  });

  const catches: Catch[] = [
    c({ id: 'demo_c1', journeyId: j1.id, species: 'achiga', weightKg: 1.35, lengthCm: 41, dateTime: `${d1}T08:10`, technique: 'Drop shot', lure: 'Vinil de 10 cm', rig: 'Anzol 1/0', color: 'verde abóbora', depthM: 4, released: true }),
    c({ id: 'demo_c2', journeyId: j1.id, species: 'achiga', weightKg: 0.8, lengthCm: 34, dateTime: `${d1}T09:40`, technique: 'Vinil texano', lure: 'Craw', rig: 'Texas 7 g', color: 'castanho', released: true }),
    c({ id: 'demo_c3', journeyId: j2.id, species: 'lucioperca', weightKg: 2.1, lengthCm: 58, dateTime: `${d2}T07:25`, technique: 'Jig', lure: 'Jig 14 g', color: 'branco', depthM: 9, released: true }),
    c({ id: 'demo_c4', journeyId: j2.id, species: 'achiga', weightKg: 1.9, lengthCm: 46, dateTime: `${d2}T09:05`, technique: 'Vinil com cabeça chumbada', lure: 'Shad 12 cm', rig: 'Cabeça 10 g', color: 'natural', depthM: 5, released: true }),
    c({ id: 'demo_c5', journeyId: j2.id, species: 'achiga', dateTime: `${d2}T11:50`, technique: 'Vinil com cabeça chumbada', lure: 'Shad 12 cm', color: 'natural' }),
    c({ id: 'demo_c6', journeyId: j4.id, species: 'achiga', weightKg: 1.1, lengthCm: 37, dateTime: `${d4}T19:30`, technique: 'Spinnerbait', lure: 'Spinnerbait 10 g', color: 'branco e azul', released: true }),
  ];

  return { journeys: [planned, j1, j2, j3, j4], catches };
}
