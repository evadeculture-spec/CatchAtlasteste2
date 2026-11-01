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

export const AREA_NAMES: [string, string] = ['Preparar jornada', 'Contar história'];

/**
 * Cabeçalho simples: indicador de dois segmentos (também tocáveis para alternar),
 * marca e perfil. O nome de cada área vive dentro da própria face e roda com o cubo.
 * O progresso contínuo chega através da variável CSS --p (definida no elemento .app).
 */
export const Header = forwardRef<HTMLElement, Props>(function Header(
  { active, onSelect, onProfile, tabIds, panelIds, initials },
  ref,
) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    let next: 0 | 1 | null = null;
    if (e.key === 'ArrowRight' || e.key === 'End') next = 1;
    if (e.key === 'ArrowLeft' || e.key === 'Home') next = 0;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(next);
    document.getElementById(tabIds[next])?.focus();
  };

  return (
    <header className="app-header" ref={ref}>
      <div className="story-bars" role="tablist" aria-label="Áreas da CatchAtlas" onKeyDown={onKeyDown}>
        {AREA_NAMES.map((name, i) => (
          <button
            key={name}
            id={tabIds[i]}
            type="button"
            role="tab"
            className={`story-bar story-bar--${i}`}
            aria-label={name}
            aria-selected={active === i}
            aria-controls={panelIds[i]}
            tabIndex={active === i ? 0 : -1}
            onClick={() => onSelect(i as 0 | 1)}
          >
            <span className="story-track">
              <i />
            </span>
          </button>
        ))}
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
    </header>
  );
});
