import { useCallback, useEffect, useRef, useState } from 'react';
import { CubeStage } from './components/CubeStage';
import { Header } from './components/Header';
import { Toasts } from './components/ui';
import { AreaFace } from './components/AreaTitle';
import { PrepareArea } from './areas/PrepareArea';
import { HistoryArea } from './areas/HistoryArea';
import { StoreProvider, useStore } from './state/store';
import { UiProvider, useUi, type SheetSpec } from './state/ui';
import { PlannerSheet } from './sheets/PlannerSheet';
import { PlanSheet } from './sheets/PlanSheet';
import { SpotSheet } from './sheets/SpotSheet';
import { CatchSheet } from './sheets/CatchSheet';
import { LogSheet } from './sheets/LogSheet';
import { CompleteSheet } from './sheets/CompleteSheet';
import { JourneySheet } from './sheets/JourneySheet';
import { StorySheet } from './sheets/StorySheet';
import { ProfileSheet } from './sheets/ProfileSheet';

const TAB_IDS: [string, string] = ['tab-prepare', 'tab-history'];
const PANEL_IDS: [string, string] = ['panel-prepare', 'panel-history'];

function useSystemReducedMotion() {
  const [reduce, setReduce] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduce(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
}

function isEditable(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  return !!t.closest('input, textarea, select, [contenteditable="true"], [role="tablist"], [role="radiogroup"]');
}

function SheetHost() {
  const { sheets } = useUi();
  return (
    <>
      {sheets.map((s, i) => (
        <SheetSwitch key={s.key} spec={s} top={i === sheets.length - 1} />
      ))}
    </>
  );
}

function SheetSwitch({ spec, top }: { spec: SheetSpec; top: boolean }) {
  switch (spec.type) {
    case 'planner':
      return <PlannerSheet journeyId={spec.journeyId} spotId={spec.spotId} top={top} />;
    case 'plan':
      return <PlanSheet journeyId={spec.journeyId} top={top} />;
    case 'spot':
      return <SpotSheet spotId={spec.spotId} top={top} />;
    case 'catch':
      return <CatchSheet journeyId={spec.journeyId} catchId={spec.catchId} top={top} />;
    case 'log':
      return <LogSheet top={top} />;
    case 'complete':
      return <CompleteSheet journeyId={spec.journeyId} top={top} />;
    case 'journey':
      return <JourneySheet journeyId={spec.journeyId} top={top} />;
    case 'story':
      return <StorySheet journeyId={spec.journeyId} top={top} />;
    case 'profile':
      return <ProfileSheet top={top} />;
  }
}

function Shell({ active, setActive }: { active: 0 | 1; setActive: (i: 0 | 1) => void }) {
  const { data, prefs } = useStore();
  const ui = useUi();
  const systemReduce = useSystemReducedMotion();
  const reduced = prefs.motion === 'reduce' || systemReduce;
  const appRef = useRef<HTMLDivElement>(null);
  const sheetOpen = ui.sheets.length > 0;

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduced);
  }, [reduced]);

  const onProgress = useCallback((p: number) => {
    appRef.current?.style.setProperty('--p', p.toFixed(4));
  }, []);

  // Setas do teclado (fora de campos de edição e sem painéis abertos)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheetOpen || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (isEditable(e.target)) return;
      e.preventDefault();
      setActive(e.key === 'ArrowRight' ? 1 : 0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen, setActive]);

  const initials = data.profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join('');

  return (
    <div className="app" ref={appRef}>
      <a className="skip-link" href={`#${PANEL_IDS[active]}`} onClick={(e) => { e.preventDefault(); document.getElementById(PANEL_IDS[active])?.focus(); }}>
        Saltar para o conteúdo
      </a>
      <Header
        active={active}
        onSelect={setActive}
        onProfile={() => ui.open({ type: 'profile' })}
        tabIds={TAB_IDS}
        panelIds={PANEL_IDS}
        initials={initials}
      />
      <main className="app-main" {...(sheetOpen ? { 'aria-hidden': true } : {})}>
        <CubeStage
          active={active}
          onChange={setActive}
          faces={[
            <AreaFace key="p" index={0}>
              <PrepareArea />
            </AreaFace>,
            <AreaFace key="h" index={1}>
              <HistoryArea />
            </AreaFace>,
          ]}
          faceIds={PANEL_IDS}
          labelledBy={TAB_IDS}
          reducedMotion={reduced}
          onProgress={onProgress}
          disabled={sheetOpen}
        />
      </main>
      <SheetHost />
      <Toasts />
    </div>
  );
}

function Root() {
  const { prefs, setPrefs } = useStore();
  const [active, setActiveState] = useState<0 | 1>(prefs.activeArea ?? 0);
  const setActive = useCallback(
    (i: 0 | 1) => {
      setActiveState(i);
      setPrefs({ activeArea: i });
    },
    [setPrefs],
  );
  return (
    <UiProvider goToArea={setActive}>
      <Shell active={active} setActive={setActive} />
    </UiProvider>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}
