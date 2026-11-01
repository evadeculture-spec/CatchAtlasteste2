import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useUi } from '../state/ui';
import { Photo } from './ui';
import { AREA_NAMES } from './Header';

const COVER_ART: [string, string] = ['art:dawn', 'art:night'];
const COVER_ALT: [string, string] = [
  'Ilustração de uma albufeira ao amanhecer, com encostas de pinhal refletidas na água',
  'Ilustração de uma albufeira à noite, com lua e estrelas refletidas',
];

/**
 * Cada face do cubo começa numa capa com um único título em destaque.
 * Ao tocar, entra nos menus da área; o botão ‹ regressa à capa.
 * Os menus ficam montados (escondidos) para preservar filtros e formulários.
 */
export function AreaFace({ index, children }: { index: 0 | 1; children: ReactNode }) {
  const { entered, setEntered } = useUi();
  const isIn = entered[index];
  const coverRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const target = isIn ? backRef.current : coverRef.current;
    // Só move o foco se ele estiver dentro desta face.
    if (target && target.closest('.cube-face')?.contains(document.activeElement)) target.focus({ preventScroll: true });
  }, [isIn]);

  return (
    <>
      {!isIn && (
        <button
          ref={coverRef}
          type="button"
          className={`area-cover area-cover--${index === 0 ? 'prepare' : 'history'}`}
          onClick={() => setEntered(index, true)}
          aria-label={`Entrar em ${AREA_NAMES[index]}`}
        >
          <Photo refId={COVER_ART[index]} alt={COVER_ALT[index]} className="area-cover-photo" />
          <span className="area-cover-overlay" aria-hidden="true" />
          <span className="area-cover-content">
            <span className="area-cover-title">{AREA_NAMES[index]}</span>
            <span className="area-cover-go" aria-hidden="true">
              <ArrowRight size={26} />
            </span>
          </span>
        </button>
      )}
      <div hidden={!isIn}>
        <div className={`area-title area-title--${index === 0 ? 'prepare' : 'history'}`}>
          <button ref={backRef} type="button" className="area-title-go" onClick={() => setEntered(index, false)} aria-label="Voltar">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <h2 className="area-title-text">{AREA_NAMES[index]}</h2>
        </div>
        {children}
      </div>
    </>
  );
}
