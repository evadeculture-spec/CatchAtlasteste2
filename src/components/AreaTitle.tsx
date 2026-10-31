import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUi } from '../state/ui';
import { AREA_NAMES } from './Header';

/**
 * Título da área, dentro da própria face: roda com o cubo, como o nome da conta numa Story.
 * Só o nome desta área aparece em destaque; a passagem para a outra é um ícone discreto.
 */
export function AreaTitle({ index }: { index: 0 | 1 }) {
  const { goToArea } = useUi();
  const other = (index === 0 ? 1 : 0) as 0 | 1;
  return (
    <div className={`area-title area-title--${index === 0 ? 'prepare' : 'history'}`}>
      {index === 1 && (
        <button type="button" className="area-title-go" onClick={() => goToArea(other)} aria-label={`Ir para ${AREA_NAMES[other]}`}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      )}
      <h2 className="area-title-text">{AREA_NAMES[index]}</h2>
      {index === 0 && (
        <button type="button" className="area-title-go" onClick={() => goToArea(other)} aria-label={`Ir para ${AREA_NAMES[other]}`}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
