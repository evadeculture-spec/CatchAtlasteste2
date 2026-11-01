import { useState } from 'react';
import { CalendarDays, ChevronRight, Clock, Fish, Lock, Pencil, Sailboat, Sparkles, Wrench } from 'lucide-react';
import { modalityLabel, speciesLabel } from '../data/constants';
import { formatCm, formatDateLong, formatKg, formatM, timeOf } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Sheet } from '../components/Sheet';
import { ConfirmAction } from '../components/ConfirmAction';
import { DemoBadge, Field, Photo, PhotoInput } from '../components/ui';
import { journeyCover, journeyPlace } from '../components/journey';

/** Detalhe de uma jornada concluída, com capturas e acesso à geração da história. */
export function JourneySheet({ journeyId, top }: { journeyId: string; top: boolean }) {
  const { data, patchJourney, deleteJourney } = useStore();
  const ui = useUi();
  const j = data.journeys.find((x) => x.id === journeyId);
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(j?.summary ?? '');
  const [learnings, setLearnings] = useState(j?.learnings ?? '');
  if (!j) return null;
  const catches = data.catches.filter((c) => c.journeyId === j.id).sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const firstPhoto = catches.find((c) => c.photo)?.photo;

  const saveNotes = () => {
    patchJourney(j.id, { summary: summary.trim() || undefined, learnings: learnings.trim() || undefined });
    setEditing(false);
    ui.toast('Notas guardadas.');
  };

  return (
    <Sheet
      top={top}
      size="wide"
      tone="deep"
      title={journeyPlace(j)}
      eyebrow={formatDateLong(j.date)}
      onClose={ui.close}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={() => ui.open({ type: 'catch', journeyId: j.id })}>
            <Fish size={16} aria-hidden="true" /> Adicionar captura
          </button>
          {j.status === 'concluida' && (
            <button type="button" className="btn btn--action" onClick={() => ui.open({ type: 'story', journeyId: j.id })}>
              <Sparkles size={16} aria-hidden="true" /> {j.narrative ? 'Ver a minha história' : 'Gerar a minha história'}
            </button>
          )}
        </>
      }
    >
      <div className="journey-detail">
        <Photo refId={journeyCover(j, firstPhoto)} alt={`Fotografia de capa da jornada em ${journeyPlace(j)}`} className="plan-photo" />
        <div className="plan-meta">
          {j.demo && <DemoBadge />}
          <span className="pill pill--soft">{j.origin === 'plano' ? 'Nasceu de um plano' : 'Registada depois'}</span>
          <span className="pill pill--muted"><Lock size={12} aria-hidden="true" /> Local privado</span>
        </div>

        <dl className="facts facts--grid">
          <div>
            <dt><CalendarDays size={16} aria-hidden="true" /> Data</dt>
            <dd>{formatDateLong(j.date)}</dd>
          </div>
          <div>
            <dt><Clock size={16} aria-hidden="true" /> Horário</dt>
            <dd>{j.startTime}{j.endTime ? ` – ${j.endTime}` : ''}</dd>
          </div>
          <div>
            <dt><Sailboat size={16} aria-hidden="true" /> Modalidade</dt>
            <dd>{modalityLabel(j.modality)}</dd>
          </div>
          <div>
            <dt><Fish size={16} aria-hidden="true" /> Espécie-alvo</dt>
            <dd>{speciesLabel(j.targetSpecies)}</dd>
          </div>
          {j.techniques.length > 0 && (
            <div className="span-2">
              <dt><Wrench size={16} aria-hidden="true" /> Técnicas planeadas</dt>
              <dd>{j.techniques.join(', ')}</dd>
            </div>
          )}
        </dl>

        <div className="sub-head">
          <h3 className="sub-title">Notas</h3>
          {!editing && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
              <Pencil size={14} aria-hidden="true" /> Editar
            </button>
          )}
        </div>
        {editing ? (
          <div className="form">
            <Field label="Resumo" htmlFor="jd-sum" optional>
              <textarea id="jd-sum" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} />
            </Field>
            <Field label="O que aprendi" htmlFor="jd-learn" optional>
              <textarea id="jd-learn" rows={2} value={learnings} onChange={(e) => setLearnings(e.target.value)} maxLength={300} />
            </Field>
            <PhotoInput label="Fotografia de capa" value={j.coverPhoto?.startsWith('idb:') ? j.coverPhoto : undefined} onChange={(p) => patchJourney(j.id, { coverPhoto: p })} />
            <div className="btn-row">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setEditing(false); setSummary(j.summary ?? ''); setLearnings(j.learnings ?? ''); }}>Cancelar</button>
              <button type="button" className="btn btn--primary btn--sm" onClick={saveNotes}>Guardar notas</button>
            </div>
          </div>
        ) : j.summary || j.learnings || j.notes ? (
          <div className="notes">
            {(j.summary || j.notes) && <p>{j.summary || j.notes}</p>}
            {j.learnings && (
              <p className="learn"><b>O que aprendi:</b> {j.learnings}</p>
            )}
          </div>
        ) : (
          <p className="muted">Sem notas. Acrescenta o que viste ou aprendeste.</p>
        )}

        <h3 className="sub-title">Capturas ({catches.length})</h3>
        {catches.length === 0 ? (
          <p className="muted">Sem capturas nesta jornada. Uma história também se faz de paisagens, tentativas e aprendizagens.</p>
        ) : (
          <ul className="catch-list">
            {catches.map((c) => (
              <li key={c.id}>
                <button type="button" className="catch-row" onClick={() => ui.open({ type: 'catch', catchId: c.id })} aria-label={`Editar captura de ${speciesLabel(c.species)} às ${timeOf(c.dateTime)}`}>
                  {c.photo ? <Photo refId={c.photo} alt="" className="catch-thumb" /> : <span className="catch-thumb catch-thumb--empty" aria-hidden="true"><Fish size={20} /></span>}
                  <span className="catch-main">
                    <b>{speciesLabel(c.species)}</b>
                    <small>
                      {[c.weightKg ? formatKg(c.weightKg) : '', c.lengthCm ? formatCm(c.lengthCm) : '', timeOf(c.dateTime), c.technique, c.depthM ? formatM(c.depthM) : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </small>
                    {(c.lure || c.color || c.rig) && <small>{[c.lure, c.rig, c.color].filter(Boolean).join(' · ')}</small>}
                  </span>
                  {c.released && <span className="pill pill--ok">Devolvido</span>}
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {j.narrative && (
          <>
            <h3 className="sub-title">A minha história</h3>
            <blockquote className="story-quote">{j.narrative.text}</blockquote>
          </>
        )}

        <ConfirmAction
          label="Eliminar jornada"
          confirmLabel="Eliminar definitivamente"
          description={catches.length ? `A jornada e as ${catches.length} capturas associadas serão eliminadas.` : 'A jornada será eliminada do diário.'}
          onConfirm={async () => {
            await deleteJourney(j.id);
            ui.close();
            ui.toast('Jornada eliminada.');
          }}
        />
      </div>
    </Sheet>
  );
}
