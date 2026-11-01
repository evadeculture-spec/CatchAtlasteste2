import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type SheetSpec =
  | { type: 'planner'; journeyId?: string; spotId?: string }
  | { type: 'plan'; journeyId: string }
  | { type: 'spot'; spotId: string }
  | { type: 'catch'; journeyId?: string; catchId?: string }
  | { type: 'log' }
  | { type: 'complete'; journeyId: string }
  | { type: 'journey'; journeyId: string }
  | { type: 'story'; journeyId: string }
  | { type: 'profile' };

export interface Toast {
  id: number;
  text: string;
  tone: 'success' | 'error' | 'info';
}

interface UiApi {
  sheets: (SheetSpec & { key: number })[];
  open: (s: SheetSpec) => void;
  close: () => void;
  closeAll: () => void;
  replace: (s: SheetSpec) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
  /** Muda de área; com `enter`, entra logo nos menus dessa área (em vez da capa). */
  goToArea: (i: 0 | 1, enter?: boolean) => void;
  /** Em cada área: false = capa com o título; true = menus da área. */
  entered: [boolean, boolean];
  setEntered: (i: 0 | 1, v: boolean) => void;
  draft: <T>(key: string) => T | undefined;
  setDraft: (key: string, value: unknown) => void;
  clearDraft: (key: string) => void;
}

const Ctx = createContext<UiApi | null>(null);

export function UiProvider({ children, goToArea }: { children: ReactNode; goToArea: (i: 0 | 1) => void }) {
  const [sheets, setSheets] = useState<(SheetSpec & { key: number })[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const drafts = useRef(new Map<string, unknown>());
  const [entered, setEnteredState] = useState<[boolean, boolean]>([false, false]);
  const setEntered = useCallback((i: 0 | 1, v: boolean) => {
    setEnteredState((e) => (e[i] === v ? e : ((i === 0 ? [v, e[1]] : [e[0], v]) as [boolean, boolean])));
    // Cada mudança começa no topo da face.
    requestAnimationFrame(() => document.querySelector(`[data-face-scroll="${i}"]`)?.scrollTo(0, 0));
  }, []);
  const go = useCallback(
    (i: 0 | 1, enter?: boolean) => {
      if (enter) setEntered(i, true);
      goToArea(i);
    },
    [goToArea, setEntered],
  );

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (text: string, tone: Toast['tone'] = 'success') => {
      const id = ++counter.current;
      setToasts((t) => [...t.slice(-2), { id, text, tone }]);
      window.setTimeout(() => dismissToast(id), tone === 'error' ? 6000 : 3800);
    },
    [dismissToast],
  );

  const api = useMemo<UiApi>(
    () => ({
      sheets,
      open: (s) => setSheets((x) => [...x, { ...s, key: ++counter.current }]),
      close: () => setSheets((x) => x.slice(0, -1)),
      closeAll: () => setSheets([]),
      replace: (s) => setSheets((x) => [...x.slice(0, -1), { ...s, key: ++counter.current }]),
      toasts,
      toast,
      dismissToast,
      goToArea: go,
      entered,
      setEntered,
      draft: <T,>(k: string) => drafts.current.get(k) as T | undefined,
      setDraft: (k, v) => drafts.current.set(k, v),
      clearDraft: (k) => drafts.current.delete(k),
    }),
    [sheets, toasts, toast, dismissToast, go, entered, setEntered],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useUi(): UiApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUi fora do UiProvider');
  return v;
}
