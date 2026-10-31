import type { ChecklistItem, Modality, SpeciesId, Spot } from '../types';

export interface SpeciesInfo {
  id: SpeciesId;
  name: string;
  plural: string;
  /** Artigo indefinido: "um achigã", "uma truta". */
  article: 'um' | 'uma';
}

export const SPECIES: SpeciesInfo[] = [
  { id: 'achiga', name: 'achigã', plural: 'achigãs', article: 'um' },
  { id: 'lucio', name: 'lúcio', plural: 'lúcios', article: 'um' },
  { id: 'lucioperca', name: 'lucioperca', plural: 'luciopercas', article: 'uma' },
  { id: 'siluro', name: 'siluro', plural: 'siluros', article: 'um' },
  { id: 'truta', name: 'truta', plural: 'trutas', article: 'uma' },
  { id: 'perca', name: 'perca', plural: 'percas', article: 'uma' },
];

export const speciesById = (id?: string) => SPECIES.find((s) => s.id === id);
export const speciesLabel = (id?: string) => {
  const s = speciesById(id);
  return s ? s.name.charAt(0).toUpperCase() + s.name.slice(1) : '—';
};

export const MODALITIES: { id: Modality; label: string; short: string }[] = [
  { id: 'margem', label: 'Margem', short: 'a partir da margem' },
  { id: 'embarcacao', label: 'Embarcação', short: 'de embarcação' },
  { id: 'float-tube', label: 'Float tube', short: 'em float tube' },
];
export const modalityLabel = (m?: Modality) => MODALITIES.find((x) => x.id === m)?.label ?? '—';

export const TECHNIQUES = [
  'Vinil texano',
  'Drop shot',
  'Jig',
  'Crankbait',
  'Spinnerbait',
  'Jerkbait',
  'Amostra de superfície',
  'Colher rotativa',
  'Vinil com cabeça chumbada',
  'Swimbait',
];

export const CHECKLIST_BASE: ChecklistItem[] = [
  { id: 'material', label: 'Material de pesca', hint: 'Canas, carretos, linha e alicate.' },
  { id: 'amostras', label: 'Amostras e montagens', hint: 'Caixa preparada para a espécie e profundidade.' },
  { id: 'seguranca', label: 'Equipamento de segurança', hint: 'Colete, telemóvel carregado, alguém sabe onde vais.' },
  { id: 'agua', label: 'Água e proteção solar', hint: 'Hidratação, chapéu, óculos polarizados.' },
  {
    id: 'documentacao',
    label: 'Documentação e regras aplicáveis',
    hint: 'Licença e verificação das regras do local junto das entidades oficiais.',
  },
];

// Locais demonstrativos. As descrições são genéricas e não indicam acessos,
// licenças ou restrições — essa informação deve ser confirmada em fontes oficiais.
export const SPOTS: Spot[] = [
  {
    id: 'castelo-de-bode',
    name: 'Castelo de Bode',
    region: 'Médio Tejo',
    river: 'Rio Zêzere',
    lat: 39.545,
    lon: -8.32,
    description:
      'Grande albufeira no rio Zêzere, rodeada de encostas de pinhal e eucaliptal, com muitas reentrâncias e margens recortadas.',
    species: ['achiga', 'lucioperca', 'siluro'],
    art: 'art:dawn',
  },
  {
    id: 'alqueva',
    name: 'Alqueva',
    region: 'Alentejo',
    river: 'Rio Guadiana',
    lat: 38.2,
    lon: -7.49,
    description:
      'Uma das maiores albufeiras artificiais da Europa, com uma linha de margem extensa, ilhas e paisagem de planície alentejana.',
    species: ['achiga', 'lucioperca', 'siluro'],
    art: 'art:plain',
  },
  {
    id: 'santa-clara',
    name: 'Santa Clara',
    region: 'Odemira',
    river: 'Rio Mira',
    lat: 37.515,
    lon: -8.44,
    description:
      'Albufeira no rio Mira, no interior do Alentejo litoral, com braços estreitos e encostas de montado e medronheiro.',
    species: ['achiga'],
    art: 'art:dusk',
  },
  {
    id: 'montargil',
    name: 'Montargil',
    region: 'Alto Alentejo',
    river: 'Ribeira de Sor',
    lat: 39.08,
    lon: -8.17,
    description: 'Albufeira de águas abertas com margens de montado e pequenas praias fluviais.',
    species: ['achiga', 'lucioperca'],
    art: 'art:mist',
  },
];
export const spotById = (id?: string) => SPOTS.find((s) => s.id === id);
