import { CalendarDays, Clock, Fish, Flag, Lock, Pencil, Play, Sailboat, Wrench } from 'lucide-react';
import { modalityLabel, speciesLabel } from '../data/constants';
import { formatDateShort, relativeDay, todayISO } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Sheet } from '../components/Sheet';
import { ConfirmAction } from '../components/ConfirmAction';
import { DemoBadge, Photo } from '../components/ui';
import { Checklist, ConditionsPanel, SuggestionsList, journeyCover, journeyPlace } from '../components/journey';

export function PlanSheet({ journeyId, top }: { journeyId: string; top: boolean }) {
  const { data, startJourney, deleteJourney } = useStore();
  const ui = useUi();
  const j = data.journeys.find((x) => x.id === journeyId);
  if (!j) return null;
  const live = data.journeys.find((x) => x.status === 'em-curso');
  const catches = data.catches.filter((c) => c.journeyId === j.id);

  const start = () => {
    if (live && live.id !== j.id) {
      ui.toast('Já tens uma jornada em curso. Conclui-a antes de iniciar outra.', 'error');
      return;
    }
    startJourney(j.id);
    ui.toast(j.date === todayISO() ? 'Jornada iniciada. O registo de capturas está disponível.' : 'Jornada iniciada hoje (a data do plano foi ajustada).');
  };

  const remove = async () => {
    await deleteJourney(j.id);
    ui.close();
    ui.toast(j.status === 'em-curso' ? 'Jornada eliminada.' : 'Plano eliminado.');
  };

  return (
    <Sheet
      top={top}
      size="wide"
      title={journeyPlace(j)}
      eyebrow={j.status === 'em-curso' ? 'Jornada em curso' : 'Plano da jornada'}
      onClose={ui.close}
      footer={
        j.status === 'planeada' ? (
          <>
            <button type="button" className="btn btn--ghost" onClick={() => ui.open({ type: 'planner', journeyId: j.id })}>
              <Pencil size={16} aria-hidden="true" /> Editar
            </button>
            <button type="button" className="btn btn--primary" onClick={start}>
              <Play size={16} aria-hidden="true" /> Iniciar jornada
            </button>
          </>
        ) : j.status === 'em-curso' ? (
          <>
            <button type="button" className="btn btn--ghost" onClick={() => ui.open({ type: 'catch', journeyId: j.id })}>
              <Fish size={16} aria-hidden="true" /> Adicionar captura
            </button>
            <button type="button" className="btn btn--primary" onClick={() => ui.open({ type: 'complete', journeyId: j.id })}>
              <Flag size={16} aria-hidden="true" /> Concluir jornada
            </button>
          </>
        ) : undefined
      }
    >
      <div className="plan">
        <Photo refId={journeyCover(j)} alt={`Paisagem de ${journeyPlace(j)}`} className="plan-photo" />
        <div className="plan-meta">
          <span className="pill pill--soft">{j.status === 'em-curso' ? `Em curso · ${catches.length} capturas` : relativeDay(j.date)}</span>
          {j.demo && <DemoBadge />}
          <span className="pill pill--muted">
            <Lock size={12} aria-hidden="true" /> Local privado
          </span>
        </div>
        <dl className="facts facts--grid">
          <div>
            <dt><CalendarDays size={16} aria-hidden="true" /> Data</dt>
            <dd>{formatDateShort(j.date)}</dd>
          </div>
          <div>
            <dt><Clock size={16} aria-hidden="true" /> Início</dt>
            <dd>{j.startTime}</dd>
          </div>
          <div>
            <dt><Fish size={16} aria-hidden="true" /> Espécie-alvo</dt>
            <dd>{speciesLabel(j.targetSpecies)}</dd>
          </div>
          <div>
            <dt><Sailboat size={16} aria-hidden="true" /> Modalidade</dt>
            <dd>{modalityLabel(j.modality)}</dd>
          </div>
          <div className="span-2">
            <dt><Wrench size={16} aria-hidden="true" /> Técnicas</dt>
            <dd>{j.techniques.length ? j.techniques.join(', ') : 'Por definir'}</dd>
          </div>
        </dl>
        {j.notes && <blockquote className="note">{j.notes}</blockquote>}

        <h3 className="sub-title">Condições <span className="badge badge--demo">Demonstração</span></h3>
        <ConditionsPanel journey={j} />

        <h3 className="sub-title">Sugestões de preparação</h3>
        <SuggestionsList journey={j} />

        <h3 className="sub-title">Checklist desta jornada</h3>
        <Checklist journey={j} />

        <ConfirmAction
          label={j.status === 'em-curso' ? 'Eliminar jornada' : 'Eliminar plano'}
          confirmLabel="Eliminar definitivamente"
          description={catches.length ? `Também serão eliminadas ${catches.length} capturas associadas.` : undefined}
          onConfirm={remove}
        />
      </div>
    </Sheet>
  );
}
