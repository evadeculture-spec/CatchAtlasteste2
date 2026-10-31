import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import type { Journey, Modality, SpeciesId } from '../types';
import { MODALITIES, SPECIES, SPOTS, speciesLabel, spotById } from '../data/constants';
import { todayISO, uid } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Sheet } from '../components/Sheet';
import { Field, PhotoInput, Segmented } from '../components/ui';

interface Draft {
  spotId: string;
  customLocation: string;
  date: string;
  startTime: string;
  endTime: string;
  targetSpecies: SpeciesId | '';
  modality: Modality;
  summary: string;
  learnings: string;
  coverPhoto?: string;
}

/** Registar uma jornada passada, sem planeamento prévio. */
export function LogSheet({ top }: { top: boolean }) {
  const { upsertJourney } = useStore();
  const ui = useUi();
  const key = 'log:new';
  const [d, setD] = useState<Draft>(
    () =>
      ui.draft<Draft>(key) ?? {
        spotId: '',
        customLocation: '',
        date: todayISO(),
        startTime: '07:00',
        endTime: '',
        targetSpecies: '',
        modality: 'margem',
        summary: '',
        learnings: '',
      },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) ui.setDraft(key, d);
  }, [d, done, ui]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!d.spotId) e.spotId = 'Escolhe um local.';
    if (d.spotId === 'outro' && d.customLocation.trim().length < 2) e.customLocation = 'Escreve o nome do local.';
    if (!d.date) e.date = 'Indica a data.';
    else if (d.date > todayISO()) e.date = 'Para datas futuras usa “Planear jornada”.';
    if (!d.startTime) e.startTime = 'Indica a hora de início.';
    if (d.endTime && d.endTime <= d.startTime) e.endTime = 'A hora de fim deve ser posterior ao início.';
    setErrors(e);
    if (Object.keys(e).length) {
      ui.toast('Revê os campos assinalados.', 'error');
      return;
    }
    const spot = spotById(d.spotId);
    const now = new Date().toISOString();
    const j: Journey = {
      id: uid('j'),
      status: 'concluida',
      origin: 'registo',
      spotId: spot?.id,
      locationName: spot?.name ?? d.customLocation.trim(),
      locationPrivate: true,
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime || undefined,
      targetSpecies: d.targetSpecies || undefined,
      modality: d.modality,
      techniques: [],
      notes: '',
      summary: d.summary.trim() || undefined,
      learnings: d.learnings.trim() || undefined,
      coverPhoto: d.coverPhoto,
      checklist: {},
      customChecklist: [],
      createdAt: now,
      completedAt: now,
    };
    upsertJourney(j);
    setDone(true);
    ui.clearDraft(key);
    ui.toast('Jornada registada no diário.');
    ui.replace({ type: 'journey', journeyId: j.id });
  };

  return (
    <Sheet
      top={top}
      title="Registar jornada"
      eyebrow="Gera a tua história"
      onClose={ui.close}
      tone="deep"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={ui.close}>Cancelar</button>
          <button type="submit" form="log-form" className="btn btn--primary">Guardar no diário</button>
        </>
      }
    >
      <form id="log-form" className="form" onSubmit={submit} noValidate>
        <p className="form-intro">Para uma jornada que já viveste. Depois de guardar, podes acrescentar capturas — ou nenhuma.</p>
        <Field label="Local" htmlFor="lg-spot" error={errors.spotId}>
          <select id="lg-spot" value={d.spotId} onChange={(e) => set('spotId', e.target.value)} data-autofocus>
            <option value="">Escolhe um local…</option>
            {SPOTS.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.region}</option>
            ))}
            <option value="outro">Outro local (escrever)</option>
          </select>
        </Field>
        {d.spotId === 'outro' && (
          <Field label="Nome do local" htmlFor="lg-loc" error={errors.customLocation}>
            <input id="lg-loc" value={d.customLocation} onChange={(e) => set('customLocation', e.target.value)} maxLength={80} />
          </Field>
        )}
        <p className="privacy-note">
          <Lock size={14} aria-hidden="true" /> Local privado por defeito.
        </p>
        <div className="form-row form-row--3">
          <Field label="Data" htmlFor="lg-date" error={errors.date}>
            <input id="lg-date" type="date" value={d.date} max={todayISO()} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Início" htmlFor="lg-start" error={errors.startTime}>
            <input id="lg-start" type="time" value={d.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </Field>
          <Field label="Fim" htmlFor="lg-end" optional error={errors.endTime}>
            <input id="lg-end" type="time" value={d.endTime} onChange={(e) => set('endTime', e.target.value)} />
          </Field>
        </div>
        <Field label="Espécie-alvo" htmlFor="lg-sp" optional>
          <select id="lg-sp" value={d.targetSpecies} onChange={(e) => set('targetSpecies', e.target.value as SpeciesId | '')}>
            <option value="">Sem espécie definida</option>
            {SPECIES.map((s) => (
              <option key={s.id} value={s.id}>{speciesLabel(s.id)}</option>
            ))}
          </select>
        </Field>
        <Segmented label="Modalidade" value={d.modality} options={MODALITIES.map((m) => ({ id: m.id, label: m.label }))} onChange={(v) => set('modality', v)} />
        <Field label="Resumo" htmlFor="lg-sum" optional hint="O que viste, como estava a água, com quem foste.">
          <textarea id="lg-sum" rows={3} value={d.summary} onChange={(e) => set('summary', e.target.value)} maxLength={500} />
        </Field>
        <Field label="O que aprendi" htmlFor="lg-learn" optional>
          <textarea id="lg-learn" rows={2} value={d.learnings} onChange={(e) => set('learnings', e.target.value)} maxLength={300} />
        </Field>
        <PhotoInput label="Fotografia de capa" value={d.coverPhoto} onChange={(p) => set('coverPhoto', p)} />
      </form>
    </Sheet>
  );
}
