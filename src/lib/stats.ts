// Indicadores derivados exclusivamente dos registos existentes.
import type { Catch, Journey, SpeciesId } from '../types';

export interface Stats {
  completedJourneys: number;
  totalCatches: number;
  topSpecies?: { id: SpeciesId; count: number };
  bestByWeight?: Catch;
  releasedCount: number;
}

export function computeStats(journeys: Journey[], catches: Catch[]): Stats {
  const completedIds = new Set(journeys.filter((j) => j.status === 'concluida').map((j) => j.id));
  const validJourneyIds = new Set(journeys.map((j) => j.id));
  // Uma captura só conta se pertencer a uma jornada existente.
  const valid = catches.filter((c) => validJourneyIds.has(c.journeyId));
  const counts = new Map<SpeciesId, number>();
  for (const c of valid) counts.set(c.species, (counts.get(c.species) ?? 0) + 1);
  let topSpecies: Stats['topSpecies'];
  for (const [id, count] of counts) {
    if (!topSpecies || count > topSpecies.count) topSpecies = { id, count };
  }
  let bestByWeight: Catch | undefined;
  for (const c of valid) {
    if (c.weightKg && c.weightKg > 0 && (!bestByWeight || c.weightKg > (bestByWeight.weightKg ?? 0))) bestByWeight = c;
  }
  return {
    completedJourneys: completedIds.size,
    totalCatches: valid.length,
    topSpecies,
    bestByWeight,
    releasedCount: valid.filter((c) => c.released).length,
  };
}
