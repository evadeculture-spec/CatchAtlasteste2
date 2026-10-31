// Modelos de dados da CatchAtlas.
// Fonte única de verdade: as capturas pertencem a uma jornada (journeyId)
// e todos os indicadores são derivados destes registos.

export type SpeciesId = 'achiga' | 'lucio' | 'lucioperca' | 'siluro' | 'truta' | 'perca';
export type Modality = 'margem' | 'embarcacao' | 'float-tube';
export type JourneyStatus = 'planeada' | 'em-curso' | 'concluida';

/** Referência a uma fotografia: `idb:<id>` (IndexedDB) ou `art:<variante>` (ilustração incluída). */
export type PhotoRef = string;

export interface Profile {
  name: string;
  region: string;
  createdAt: string;
}

export interface Preferences {
  activeArea: 0 | 1;
  motion: 'system' | 'reduce';
}

export interface Spot {
  id: string;
  name: string;
  region: string;
  river: string;
  lat: number;
  lon: number;
  description: string;
  species: SpeciesId[];
  art: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  hint?: string;
  custom?: boolean;
}

export interface Narrative {
  text: string;
  variant: number;
  updatedAt: string;
}

export interface Journey {
  id: string;
  status: JourneyStatus;
  /** 'plano' quando nasceu no planeador; 'registo' quando foi registada a posteriori. */
  origin: 'plano' | 'registo';
  spotId?: string;
  locationName: string;
  /** A localização é privada por defeito. */
  locationPrivate: boolean;
  date: string; // AAAA-MM-DD
  startTime: string; // HH:MM
  endTime?: string; // HH:MM
  targetSpecies?: SpeciesId;
  modality: Modality;
  techniques: string[];
  notes: string;
  learnings?: string;
  summary?: string;
  coverPhoto?: PhotoRef;
  checklist: Record<string, boolean>;
  customChecklist: ChecklistItem[];
  narrative?: Narrative;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  demo?: boolean;
}

export interface Catch {
  id: string;
  journeyId: string;
  species: SpeciesId;
  weightKg?: number;
  lengthCm?: number;
  dateTime: string; // AAAA-MM-DDTHH:MM
  technique: string;
  lure: string;
  rig: string;
  color: string;
  depthM?: number;
  photo?: PhotoRef;
  notes: string;
  released?: boolean;
  createdAt: string;
  demo?: boolean;
}

export interface AppData {
  version: 1;
  profile: Profile;
  journeys: Journey[];
  catches: Catch[];
  demoLoaded: boolean;
}
