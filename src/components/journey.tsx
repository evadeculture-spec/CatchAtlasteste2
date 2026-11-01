import { useState } from 'react';
import { Check, CloudRain, Plus, Sunrise, Sunset, Thermometer, Trash2, Wind, Lightbulb, Radio, Fish, Flag } from 'lucide-react';
import type { Journey } from '../types';
import { CHECKLIST_BASE, spotById } from '../data/constants';
import { demoConditions } from '../lib/conditions';
import { buildSuggestions } from '../lib/suggestions';
import { artForId } from '../lib/landscape';
import { formatNumber, uid } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { ProgressBar, DemoBadge } from './ui';

export function journeyPlace(j: Journey) {
  return spotById(j.spotId)?.name ?? j.locationName;
}

export function journeyCover(j: Journey, firstCatchPhoto?: string) {
  return j.coverPhoto ?? firstCatchPhoto ?? spotById(j.spotId)?.art ?? artForId(j.id);
}

export function checklistItems(j: Journey) {
  return [...CHECKLIST_BASE, ...j.customChecklist];
}

export function prepState(j: Journey) {
  const items = checklistItems(j);
  const done = items.filter((i) => j.checklist[i.id]).length;
  const label = done === 0 ? 'Por preparar' : done === items.length ? 'Pronta' : 'Em preparação';
  return { done, total: items.length, label };
}

export function conditionsFor(j: Journey) {
  const spot = spotById(j.spotId);
  return demoConditions(j.spotId ?? j.locationName, j.date, j.startTime, spot?.lat, spot?.lon);
}

export function DemoDataNote({ children }: { children: React.ReactNode }) {
  return <p className="demo-note">{children}</p>;
}

export function ConditionsPanel({ journey }: { journey: Journey }) {
  const c = conditionsFor(journey);
  return (
    <div className="conditions">
      <div className="cond-grid">
        <div className="cond">
          <Thermometer size={20} aria-hidden="true" />
          <span className="cond-label">Temperatura</span>
          <strong>{c.tempAtStart} °C</strong>
          <span className="cond-sub">
            mín. {c.tempMin}° · máx. {c.tempMax}°
          </span>
        </div>
        <div className="cond">
          <Wind size={20} aria-hidden="true" />
          <span className="cond-label">Vento</span>
          <strong>{c.windKmh} km/h</strong>
          <span className="cond-sub">de {c.windDir}</span>
        </div>
        <div className="cond">
          <CloudRain size={20} aria-hidden="true" />
          <span className="cond-label">Precipitação</span>
          <strong>{c.precipMm > 0 ? `${formatNumber(c.precipMm)} mm` : '0 mm'}</strong>
          <span className="cond-sub">{c.sky}</span>
        </div>
        <div className="cond">
          <Sunrise size={20} aria-hidden="true" />
          <span className="cond-label">Sol</span>
          <strong>{c.sunrise}</strong>
          <span className="cond-sub">
            <Sunset size={13} aria-hidden="true" /> pôr às {c.sunset}
          </span>
        </div>
      </div>
      <DemoDataNote>
        <b>Dados demonstrativos.</b> Valores ilustrativos, não são uma previsão meteorológica. O nascer e o pôr do sol são um cálculo
        aproximado. Consulta uma fonte oficial antes de sair.
      </DemoDataNote>
    </div>
  );
}

export function SuggestionsList({ journey, limit }: { journey: Journey; limit?: number }) {
  const all = buildSuggestions(journey, conditionsFor(journey));
  const items = limit ? [...all.filter((s) => s.source === 'plano').slice(0, limit - 1), ...all.filter((s) => s.source === 'exemplo')] : all;
  return (
    <ul className="suggestions">
      {items.map((s) => (
        <li key={s.id} className={`suggestion${s.source === 'exemplo' ? ' suggestion--demo' : ''}`}>
          <span className="suggestion-icon" aria-hidden="true">
            {s.source === 'exemplo' ? <Radio size={18} /> : <Lightbulb size={18} />}
          </span>
          <div>
            <h4>
              {s.title} {s.source === 'exemplo' && <DemoBadge />}
            </h4>
            <p>{s.text}</p>
            <p className="why">
              <b>Porquê:</b> {s.reason}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Checklist({ journey }: { journey: Journey }) {
  const { toggleChecklist, patchJourney } = useStore();
  const { toast } = useUi();
  const [text, setText] = useState('');
  const items = checklistItems(journey);
  const st = prepState(journey);
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const label = text.trim();
    if (!label) return;
    if (label.length > 60) {
      toast('Usa no máximo 60 caracteres.', 'error');
      return;
    }
    patchJourney(journey.id, { customChecklist: [...journey.customChecklist, { id: uid('ck'), label, custom: true }] });
    setText('');
  };
  return (
    <div className="checklist">
      <div className="checklist-head">
        <span>
          <b>{st.done}</b> de {st.total} preparados
        </span>
        <span className={`pill pill--${st.label === 'Pronta' ? 'ok' : 'muted'}`}>{st.label}</span>
      </div>
      <ProgressBar value={st.done} max={st.total} label="Progresso da preparação" />
      <ul>
        {items.map((i) => {
          const on = !!journey.checklist[i.id];
          return (
            <li key={i.id} className={on ? 'is-done' : ''}>
              <label className="check-row">
                <input type="checkbox" checked={on} onChange={() => toggleChecklist(journey.id, i.id)} />
                <span className="check-box" aria-hidden="true">
                  <Check size={14} strokeWidth={3} />
                </span>
                <span className="check-text">
                  <span>{i.label}</span>
                  {i.hint && <small>{i.hint}</small>}
                </span>
              </label>
              {i.custom && (
                <button
                  type="button"
                  className="icon-btn icon-btn--sm"
                  aria-label={`Remover ${i.label}`}
                  onClick={() =>
                    patchJourney(journey.id, { customChecklist: journey.customChecklist.filter((x) => x.id !== i.id) })
                  }
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <form className="checklist-add" onSubmit={add}>
        <label className="visually-hidden" htmlFor={`ck-${journey.id}`}>
          Novo item da checklist
        </label>
        <input id={`ck-${journey.id}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Acrescentar item…" maxLength={80} />
        <button type="submit" className="icon-btn icon-btn--filled" aria-label="Acrescentar item" disabled={!text.trim()}>
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
}

/** Faixa que aparece nas duas áreas enquanto uma jornada está em curso. */
export function LiveBanner({ journey, catches, tone = 'light' }: { journey: Journey; catches: number; tone?: 'light' | 'deep' }) {
  const { open } = useUi();
  return (
    <section className={`live-banner live-banner--${tone}`} aria-label="Jornada em curso">
      <div className="live-info">
        <span className="live-dot" aria-hidden="true" />
        <div>
          <p className="eyebrow">Jornada em curso</p>
          <p className="live-title">
            {journeyPlace(journey)} · {catches === 1 ? '1 captura' : `${catches} capturas`}
          </p>
        </div>
      </div>
      <div className="live-actions">
        <button type="button" className="btn btn--action btn--sm" onClick={() => open({ type: 'catch', journeyId: journey.id })}>
          <Fish size={16} aria-hidden="true" /> Adicionar captura
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => open({ type: 'complete', journeyId: journey.id })}>
          <Flag size={16} aria-hidden="true" /> Concluir
        </button>
      </div>
    </section>
  );
}
