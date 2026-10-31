import { useState } from 'react';
import { CalendarDays, Fish, Sailboat } from 'lucide-react';
import { modalityLabel } from '../data/constants';
import { formatDateShort, nowTime, todayISO } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Sheet } from '../components/Sheet';
import { Field, PhotoInput } from '../components/ui';
import { journeyPlace } from '../components/journey';

/** Concluir uma jornada em curso. Local, data e modalidade já vêm do plano. */
export function CompleteSheet({ journeyId, top }: { journeyId: string; top: boolean }) {
  const { data, completeJourney } = useStore();
  const ui = useUi();
  const j = data.journeys.find((x) => x.id === journeyId);
  const [endTime, setEndTime] = useState(() => (j && j.date === todayISO() ? nowTime() : j?.endTime ?? ''));
  const [summary, setSummary] = useState(j?.summary ?? '');
  const [learnings, setLearnings] = useState(j?.learnings ?? '');
  const [cover, setCover] = useState<string | undefined>(j?.coverPhoto);
  const [error, setError] = useState('');
  if (!j) return null;
  const n = data.catches.filter((c) => c.journeyId === j.id).length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endTime && endTime <= j.startTime) {
      setError('A hora de fim deve ser posterior ao início (' + j.startTime + ').');
      return;
    }
    completeJourney(j.id, { endTime: endTime || undefined, summary: summary.trim() || undefined, learnings: learnings.trim() || undefined, coverPhoto: cover });
    ui.closeAll();
    ui.goToArea(1);
    ui.toast('Jornada concluída e guardada no diário.');
    window.setTimeout(() => ui.open({ type: 'journey', journeyId: j.id }), 480);
  };

  return (
    <Sheet
      top={top}
      title="Concluir jornada"
      eyebrow={journeyPlace(j)}
      onClose={ui.close}
      tone="deep"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={ui.close}>Voltar</button>
          <button type="submit" form="complete-form" className="btn btn--primary">Concluir e guardar</button>
        </>
      }
    >
      <form id="complete-form" className="form" onSubmit={submit} noValidate>
        <div className="linked">
          <span className="eyebrow">Do teu plano</span>
          <b>{journeyPlace(j)}</b>
          <span className="linked-facts">
            <span><CalendarDays size={14} aria-hidden="true" /> {formatDateShort(j.date)} · {j.startTime}</span>
            <span><Sailboat size={14} aria-hidden="true" /> {modalityLabel(j.modality)}</span>
            <span><Fish size={14} aria-hidden="true" /> {n === 0 ? 'Sem capturas' : n === 1 ? '1 captura' : `${n} capturas`}</span>
          </span>
        </div>
        {n === 0 && (
          <p className="form-intro">Sem capturas registadas — também é uma história. Podes concluir assim ou adicionar capturas antes.</p>
        )}
        <Field label="Hora de fim" htmlFor="cp-end" optional error={error}>
          <input id="cp-end" type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); setError(''); }} data-autofocus />
        </Field>
        <Field label="Resumo" htmlFor="cp-sum" optional hint="Paisagens, tentativas, companhia — o que quiseres guardar.">
          <textarea id="cp-sum" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} />
        </Field>
        <Field label="O que aprendi" htmlFor="cp-learn" optional>
          <textarea id="cp-learn" rows={2} value={learnings} onChange={(e) => setLearnings(e.target.value)} maxLength={300} />
        </Field>
        <PhotoInput label="Fotografia de capa" value={cover} onChange={setCover} />
        <button type="button" className="btn btn--ghost btn--block" onClick={() => ui.open({ type: 'catch', journeyId: j.id })}>
          <Fish size={16} aria-hidden="true" /> {n === 0 ? 'Adicionar captura antes de concluir' : 'Adicionar mais uma captura'}
        </button>
      </form>
    </Sheet>
  );
}
