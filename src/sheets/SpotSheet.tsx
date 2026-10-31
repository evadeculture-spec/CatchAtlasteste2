import { Compass, Info } from 'lucide-react';
import { speciesLabel, spotById } from '../data/constants';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Sheet } from '../components/Sheet';
import { DemoBadge, Photo } from '../components/ui';
import { formatDateShort } from '../lib/format';

export function SpotSheet({ spotId, top }: { spotId: string; top: boolean }) {
  const s = spotById(spotId);
  const ui = useUi();
  const { data } = useStore();
  if (!s) return null;
  const mine = data.journeys.filter((j) => j.spotId === s.id && j.status === 'concluida');
  const catches = data.catches.filter((c) => mine.some((j) => j.id === c.journeyId)).length;
  return (
    <Sheet
      top={top}
      title={s.name}
      eyebrow={`${s.river} · ${s.region}`}
      onClose={ui.close}
      footer={
        <button type="button" className="btn btn--primary btn--block" onClick={() => ui.replace({ type: 'planner', spotId: s.id })}>
          <Compass size={18} aria-hidden="true" /> Planear jornada aqui
        </button>
      }
    >
      <div className="spot-detail">
        <Photo refId={s.art} alt={`Ilustração de ${s.name}`} className="plan-photo" />
        <div className="plan-meta">
          <DemoBadge />
          <span className="pill pill--muted">Ilustração, não é um mapa</span>
        </div>
        <p className="lead">{s.description}</p>
        <h3 className="sub-title">Espécies frequentemente associadas</h3>
        <ul className="tag-list">
          {s.species.map((x) => (
            <li key={x} className="pill pill--soft">{speciesLabel(x)}</li>
          ))}
        </ul>
        <h3 className="sub-title">No teu diário</h3>
        <p>
          {mine.length === 0
            ? 'Ainda não registaste jornadas neste local.'
            : `${mine.length} ${mine.length === 1 ? 'jornada concluída' : 'jornadas concluídas'} · ${catches} ${catches === 1 ? 'captura' : 'capturas'}. Última: ${formatDateShort(mine.map((j) => j.date).sort().reverse()[0], false)}.`}
        </p>
        <p className="callout">
          <Info size={18} aria-hidden="true" />
          <span>
            A CatchAtlas não indica acessos permitidos, licenças nem restrições. Confirma sempre as regras aplicáveis junto das entidades
            oficiais antes de pescar.
          </span>
        </p>
      </div>
    </Sheet>
  );
}
