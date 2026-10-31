import { forwardRef } from 'react';
import { UserRound } from 'lucide-react';
import { Logo } from './ui';

interface Props {
  active: 0 | 1;
  onSelect: (i: 0 | 1) => void;
  onProfile: () => void;
  tabIds: [string, string];
  panelIds: [string, string];
  initials: string;
}

export const AREA_NAMES: [string, string] = ['Prepara a tua jornada', 'Gera a tua história'];

/**
 * Cabeçalho fixo: marca, perfil, seletor das duas áreas e indicador de dois segmentos.
 * O progresso contínuo chega através da variável CSS --p (definida no elemento .app).
 */
export const Header = forwardRef<HTMLElement, Props>(function Header(
  { active, onSelect, onProfile, tabIds, panelIds, initials },
  ref,
) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      const next = e.key === 'ArrowRight' ? 1 : 0;
      onSelect(next);
      document.getElementById(tabIds[next])?.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const next = e.key === 'Home' ? 0 : 1;
      onSelect(next);
      document.getElementById(tabIds[next])?.focus();
    }
  };

  return (
    <header className="app-header" ref={ref}>
      <div className="story-bars" aria-hidden="true">
        <span className="story-bar story-bar--0"><i /></span>
        <span className="story-bar story-bar--1"><i /></span>
      </div>
      <div className="brand-row">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); onSelect(0); }} aria-label="CatchAtlas — início">
          <Logo size={30} />
          <span className="wordmark">
            Catch<b>Atlas</b>
          </span>
        </a>
        <button type="button" className="profile-btn" onClick={onProfile} aria-label="Abrir perfil e definições">
          {initials ? <span className="avatar">{initials}</span> : <UserRound size={20} aria-hidden="true" />}
        </button>
      </div>
      <div className="area-switch" role="tablist" aria-label="Áreas da CatchAtlas" onKeyDown={onKeyDown}>
        <span className="area-thumb" aria-hidden="true" />
        {AREA_NAMES.map((name, i) => (
          <button
            key={name}
            id={tabIds[i]}
            type="button"
            role="tab"
            className={`area-tab${active === i ? ' is-active' : ''}`}
            aria-selected={active === i}
            aria-controls={panelIds[i]}
            tabIndex={active === i ? 0 : -1}
            onClick={() => onSelect(i as 0 | 1)}
          >
            {name}
          </button>
        ))}
      </div>
    </header>
  );
});
