import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData, Catch, Journey, Narrative, Preferences, Profile } from '../types';
import { buildDemo } from '../data/demo';
import { nowTime, todayISO } from '../lib/format';
import { clearPhotos, deletePhoto } from '../lib/photos';

const DATA_KEY = 'catchatlas:data:v1';
const PREFS_KEY = 'catchatlas:prefs:v1';

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function safeSet(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const emptyProfile = (): Profile => ({ name: '', region: '', createdAt: new Date().toISOString() });

function initialData(): AppData {
  const stored = safeGet<AppData>(DATA_KEY);
  if (stored && stored.version === 1) return stored;
  const demo = buildDemo();
  return { version: 1, profile: emptyProfile(), journeys: demo.journeys, catches: demo.catches, demoLoaded: true };
}

function initialPrefs(): Preferences {
  return { activeArea: 0, motion: 'system', ...(safeGet<Partial<Preferences>>(PREFS_KEY) ?? {}) };
}

export interface CompletionInput {
  endTime?: string;
  summary?: string;
  learnings?: string;
  coverPhoto?: string;
}

interface StoreApi {
  data: AppData;
  prefs: Preferences;
  saveError: boolean;
  setPrefs: (p: Partial<Preferences>) => void;
  setProfile: (p: Partial<Profile>) => void;
  upsertJourney: (j: Journey) => void;
  patchJourney: (id: string, patch: Partial<Journey>) => void;
  deleteJourney: (id: string) => Promise<void>;
  startJourney: (id: string) => void;
  completeJourney: (id: string, input: CompletionInput) => void;
  upsertCatch: (c: Catch) => void;
  deleteCatch: (id: string) => Promise<void>;
  toggleChecklist: (journeyId: string, itemId: string) => void;
  saveNarrative: (journeyId: string, n: Narrative) => void;
  clearDemo: () => void;
  loadDemo: () => void;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [prefs, setPrefsState] = useState<Preferences>(initialPrefs);
  const [saveError, setSaveError] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    setSaveError(!safeSet(DATA_KEY, data));
  }, [data]);
  useEffect(() => {
    safeSet(PREFS_KEY, prefs);
  }, [prefs]);

  const patchJourney = useCallback((id: string, patch: Partial<Journey>) => {
    setData((d) => ({ ...d, journeys: d.journeys.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
  }, []);

  const api = useMemo<Omit<StoreApi, 'data' | 'prefs' | 'saveError'>>(
    () => ({
      setPrefs: (p) => setPrefsState((x) => ({ ...x, ...p })),
      setProfile: (p) => setData((d) => ({ ...d, profile: { ...d.profile, ...p } })),
      upsertJourney: (j) =>
        setData((d) => ({
          ...d,
          journeys: d.journeys.some((x) => x.id === j.id) ? d.journeys.map((x) => (x.id === j.id ? j : x)) : [j, ...d.journeys],
        })),
      patchJourney,
      deleteJourney: async (id) => {
        const d = dataRef.current;
        const j = d.journeys.find((x) => x.id === id);
        const cs = d.catches.filter((c) => c.journeyId === id);
        setData((x) => ({ ...x, journeys: x.journeys.filter((j) => j.id !== id), catches: x.catches.filter((c) => c.journeyId !== id) }));
        await Promise.all([deletePhoto(j?.coverPhoto), ...cs.map((c) => deletePhoto(c.photo))]);
      },
      startJourney: (id) =>
        setData((d) => ({
          ...d,
          journeys: d.journeys.map((j) =>
            j.id === id
              ? {
                  ...j,
                  status: 'em-curso',
                  startedAt: new Date().toISOString(),
                  // A jornada acontece agora: se o plano era para outro dia, a data passa a ser hoje.
                  ...(j.date !== todayISO() ? { date: todayISO(), startTime: nowTime() } : {}),
                }
              : j,
          ),
        })),
      completeJourney: (id, input) =>
        setData((d) => ({
          ...d,
          journeys: d.journeys.map((j) =>
            j.id === id
              ? {
                  ...j,
                  status: 'concluida',
                  completedAt: new Date().toISOString(),
                  endTime: input.endTime || j.endTime || (j.date === todayISO() ? nowTime() : undefined),
                  summary: input.summary ?? j.summary,
                  learnings: input.learnings ?? j.learnings,
                  coverPhoto: input.coverPhoto ?? j.coverPhoto,
                }
              : j,
          ),
        })),
      upsertCatch: (c) =>
        setData((d) => ({
          ...d,
          catches: d.catches.some((x) => x.id === c.id) ? d.catches.map((x) => (x.id === c.id ? c : x)) : [...d.catches, c],
        })),
      deleteCatch: async (id) => {
        const c = dataRef.current.catches.find((x) => x.id === id);
        setData((d) => ({ ...d, catches: d.catches.filter((x) => x.id !== id) }));
        await deletePhoto(c?.photo);
      },
      toggleChecklist: (journeyId, itemId) =>
        setData((d) => ({
          ...d,
          journeys: d.journeys.map((j) =>
            j.id === journeyId ? { ...j, checklist: { ...j.checklist, [itemId]: !j.checklist[itemId] } } : j,
          ),
        })),
      saveNarrative: (journeyId, n) => patchJourney(journeyId, { narrative: n }),
      clearDemo: () =>
        setData((d) => ({
          ...d,
          demoLoaded: false,
          journeys: d.journeys.filter((j) => !j.demo),
          catches: d.catches.filter((c) => !c.demo && d.journeys.some((j) => j.id === c.journeyId && !j.demo)),
        })),
      loadDemo: () =>
        setData((d) => {
          const demo = buildDemo();
          const ids = new Set(demo.journeys.map((j) => j.id));
          return {
            ...d,
            demoLoaded: true,
            journeys: [...d.journeys.filter((j) => !ids.has(j.id)), ...demo.journeys],
            catches: [...d.catches.filter((c) => !c.demo), ...demo.catches],
          };
        }),
      resetAll: async () => {
        await clearPhotos();
        setData({ version: 1, profile: emptyProfile(), journeys: [], catches: [], demoLoaded: false });
      },
    }),
    [patchJourney],
  );

  const value = useMemo(() => ({ ...api, data, prefs, saveError }), [api, data, prefs, saveError]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fora do StoreProvider');
  return v;
}

/** Jornada ativa (em curso) ou próxima planeada. */
export function selectNextJourney(journeys: Journey[]): Journey | undefined {
  const live = journeys.find((j) => j.status === 'em-curso');
  if (live) return live;
  return journeys
    .filter((j) => j.status === 'planeada')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
}
