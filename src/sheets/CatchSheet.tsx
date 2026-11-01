import { useEffect, useMemo, useState } from 'react';
import type { Catch, Journey, Modality, SpeciesId } from '../types';
import { MODALITIES, SPECIES, SPOTS, TECHNIQUES, speciesLabel, spotById } from '../data/constants';
import { formatDateShort, nowTime, parseDecimal, todayISO, uid } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Sheet } from '../components/Sheet';
import { Field, PhotoInput, Segmented } from '../components/ui';
import { ConfirmAction } from '../components/ConfirmAction';
import { journeyPlace } from '../components/journey';

interface Draft {
  journeyId: string; // id ou 'nova'
  newSpotId: string;
  newLocation: string;
  newModality: Modality;
  species: SpeciesId | '';
  weight: string;
  length: string;
  date: string;
  time: string;
  technique: string;
  lure: string;
  rig: string;
  color: string;
  depth: string;
  photo?: string;
  notes: string;
  released: boolean;
}

const num = (n?: number) => (n === undefined ? '' : String(n).replace('.', ','));

export function CatchSheet({ journeyId, catchId, top }: { journeyId?: string; catchId?: string; top: boolean }) {
  const { data, upsertCatch, upsertJourney, deleteCatch } = useStore();
  const ui = useUi();
  const editing = data.catches.find((c) => c.id === catchId);
  const draftKey = `catch:${catchId ?? journeyId ?? 'new'}`;

  const candidates = useMemo(
    () =>
      data.journeys
        .filter((j) => j.status !== 'planeada')
        .sort((a, b) => (a.status === 'em-curso' ? -1 : b.status === 'em-curso' ? 1 : b.date.localeCompare(a.date))),
    [data.journeys],
  );

  const [d, setD] = useState<Draft>(() => {
    const saved = ui.draft<Draft>(draftKey);
    if (saved) return saved;
    if (editing)
      return {
        journeyId: editing.journeyId,
        newSpotId: '',
        newLocation: '',
        newModality: 'margem',
        species: editing.species,
        weight: num(editing.weightKg),
        length: num(editing.lengthCm),
        date: editing.dateTime.slice(0, 10),
        time: editing.dateTime.slice(11, 16),
        technique: editing.technique,
        lure: editing.lure,
        rig: editing.rig,
        color: editing.color,
        depth: num(editing.depthM),
        photo: editing.photo,
        notes: editing.notes,
        released: !!editing.released,
      };
    const j = data.journeys.find((x) => x.id === journeyId) ?? candidates.find((x) => x.status === 'em-curso');
    const live = j?.status === 'em-curso';
    return {
      journeyId: j?.id ?? (candidates.length ? '' : 'nova'),
      newSpotId: '',
      newLocation: '',
      newModality: 'margem',
      species: j?.targetSpecies ?? '',
      weight: '',
      length: '',
      date: live || !j ? todayISO() : j.date,
      time: live || !j ? nowTime() : j.startTime,
      technique: j?.techniques[0] ?? '',
      lure: '',
      rig: '',
      color: '',
      depth: '',
      photo: undefined,
      notes: '',
      released: true,
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) ui.setDraft(draftKey, d);
  }, [d, done, draftKey, ui]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const fixedJourney = editing || journeyId ? data.journeys.find((j) => j.id === d.journeyId) : undefined;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!d.journeyId) e.journeyId = 'Escolhe a jornada desta captura.';
    if (d.journeyId === 'nova' && !d.newSpotId) e.newSpotId = 'Escolhe o local.';
    if (d.journeyId === 'nova' && d.newSpotId === 'outro' && d.newLocation.trim().length < 2) e.newLocation = 'Escreve o nome do local.';
    if (!d.species) e.species = 'Escolhe a espécie.';
    if (!d.date) e.date = 'Indica a data.';
    else if (d.date > todayISO()) e.date = 'A data não pode ser futura.';
    if (!d.time) e.time = 'Indica a hora.';
    const w = parseDecimal(d.weight);
    const l = parseDecimal(d.length);
    const dp = parseDecimal(d.depth);
    if (w !== undefined && (Number.isNaN(w) || w <= 0 || w > 120)) e.weight = 'Peso entre 0 e 120 kg.';
    if (l !== undefined && (Number.isNaN(l) || l <= 0 || l > 300)) e.length = 'Comprimento entre 0 e 300 cm.';
    if (dp !== undefined && (Number.isNaN(dp) || dp < 0 || dp > 150)) e.depth = 'Profundidade entre 0 e 150 m.';
    setErrors(e);
    if (Object.keys(e).length) {
      ui.toast('Revê os campos assinalados.', 'error');
      return;
    }

    let jid = d.journeyId;
    if (jid === 'nova') {
      const spot = spotById(d.newSpotId);
      const j: Journey = {
        id: uid('j'),
        status: 'concluida',
        origin: 'registo',
        spotId: spot?.id,
        locationName: spot?.name ?? d.newLocation.trim(),
        locationPrivate: true,
        date: d.date,
        startTime: d.time,
        modality: d.newModality,
        targetSpecies: d.species || undefined,
        techniques: d.technique ? [d.technique] : [],
        notes: '',
        checklist: {},
        customChecklist: [],
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      upsertJourney(j);
      jid = j.id;
    }

    const c: Catch = {
      id: editing?.id ?? uid('c'),
      journeyId: jid,
      species: d.species as SpeciesId,
      weightKg: w,
      lengthCm: l,
      depthM: dp,
      dateTime: `${d.date}T${d.time}`,
      technique: d.technique.trim(),
      lure: d.lure.trim(),
      rig: d.rig.trim(),
      color: d.color.trim(),
      photo: d.photo,
      notes: d.notes.trim(),
      released: d.released,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      demo: editing?.demo,
    };
    upsertCatch(c);
    setDone(true);
    ui.clearDraft(draftKey);
    ui.toast(editing ? 'Captura atualizada.' : `Captura registada: ${speciesLabel(c.species)}.`);
    ui.close();
  };

  return (
    <Sheet
      top={top}
      title={editing ? 'Editar captura' : 'Adicionar captura'}
      eyebrow="Gera a tua história"
      onClose={ui.close}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={ui.close}>
            Cancelar
          </button>
          <button type="submit" form="catch-form" className="btn btn--primary">
            {editing ? 'Guardar' : 'Registar captura'}
          </button>
        </>
      }
    >
      <form id="catch-form" className="form" onSubmit={submit} noValidate>
        {fixedJourney ? (
          <div className="linked">
            <span className="eyebrow">Jornada</span>
            <b>{journeyPlace(fixedJourney)}</b>
            <span>
              {formatDateShort(fixedJourney.date)} · {fixedJourney.status === 'em-curso' ? 'em curso' : 'concluída'}
            </span>
          </div>
        ) : (
          <>
            <Field label="Jornada" htmlFor="ct-j" error={errors.journeyId}>
              <select id="ct-j" value={d.journeyId} onChange={(e) => set('journeyId', e.target.value)}>
                <option value="">Escolhe…</option>
                {candidates.map((j) => (
                  <option key={j.id} value={j.id}>
                    {journeyPlace(j)} — {formatDateShort(j.date, false)}
                    {j.status === 'em-curso' ? ' (em curso)' : ''}
                  </option>
                ))}
                <option value="nova">Nova jornada só com esta captura</option>
              </select>
            </Field>
            {d.journeyId === 'nova' && (
              <div className="subform">
                <Field label="Local" htmlFor="ct-spot" error={errors.newSpotId}>
                  <select id="ct-spot" value={d.newSpotId} onChange={(e) => set('newSpotId', e.target.value)}>
                    <option value="">Escolhe um local…</option>
                    {SPOTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value="outro">Outro local (escrever)</option>
                  </select>
                </Field>
                {d.newSpotId === 'outro' && (
                  <Field label="Nome do local" htmlFor="ct-loc" error={errors.newLocation}>
                    <input id="ct-loc" value={d.newLocation} onChange={(e) => set('newLocation', e.target.value)} maxLength={80} />
                  </Field>
                )}
                <Segmented label="Modalidade" value={d.newModality} options={MODALITIES.map((m) => ({ id: m.id, label: m.label }))} onChange={(v) => set('newModality', v)} />
              </div>
            )}
          </>
        )}

        <Field label="Espécie" htmlFor="ct-sp" error={errors.species}>
          <select id="ct-sp" value={d.species} onChange={(e) => set('species', e.target.value as SpeciesId)} data-autofocus>
            <option value="">Escolhe a espécie…</option>
            {SPECIES.map((s) => (
              <option key={s.id} value={s.id}>{speciesLabel(s.id)}</option>
            ))}
          </select>
        </Field>

        <div className="form-row">
          <Field label="Peso (kg)" htmlFor="ct-w" optional error={errors.weight}>
            <input id="ct-w" inputMode="decimal" value={d.weight} onChange={(e) => set('weight', e.target.value)} placeholder="1,2" />
          </Field>
          <Field label="Comprimento (cm)" htmlFor="ct-l" optional error={errors.length}>
            <input id="ct-l" inputMode="decimal" value={d.length} onChange={(e) => set('length', e.target.value)} placeholder="38" />
          </Field>
        </div>

        <div className="form-row">
          <Field label="Data" htmlFor="ct-d" error={errors.date}>
            <input id="ct-d" type="date" value={d.date} max={todayISO()} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Hora" htmlFor="ct-t" error={errors.time}>
            <input id="ct-t" type="time" value={d.time} onChange={(e) => set('time', e.target.value)} />
          </Field>
        </div>

        <Field label="Técnica" htmlFor="ct-tech" optional>
          <input id="ct-tech" list="ct-tech-list" value={d.technique} onChange={(e) => set('technique', e.target.value)} placeholder="Ex.: Drop shot" maxLength={60} />
          <datalist id="ct-tech-list">
            {TECHNIQUES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>

        <div className="form-row form-row--3">
          <Field label="Amostra" htmlFor="ct-lure" optional>
            <input id="ct-lure" value={d.lure} onChange={(e) => set('lure', e.target.value)} placeholder="Vinil 10 cm" maxLength={60} />
          </Field>
          <Field label="Montagem" htmlFor="ct-rig" optional>
            <input id="ct-rig" value={d.rig} onChange={(e) => set('rig', e.target.value)} placeholder="Texas 7 g" maxLength={60} />
          </Field>
          <Field label="Cor" htmlFor="ct-color" optional>
            <input id="ct-color" value={d.color} onChange={(e) => set('color', e.target.value)} placeholder="Verde" maxLength={40} />
          </Field>
        </div>

        <Field label="Profundidade (m)" htmlFor="ct-depth" optional error={errors.depth}>
          <input id="ct-depth" inputMode="decimal" value={d.depth} onChange={(e) => set('depth', e.target.value)} placeholder="4" />
        </Field>

        <PhotoInput value={d.photo} onChange={(p) => set('photo', p)} />

        <Field label="Notas" htmlFor="ct-notes" optional>
          <textarea id="ct-notes" rows={3} value={d.notes} onChange={(e) => set('notes', e.target.value)} maxLength={500} placeholder="O que aconteceu, onde estava o peixe…" />
        </Field>

        <label className="switch-row">
          <input type="checkbox" checked={d.released} onChange={(e) => set('released', e.target.checked)} />
          <span className="switch" aria-hidden="true" />
          <span>
            <b>Captura e devolução</b>
            <small>Indica se o peixe foi devolvido à água.</small>
          </span>
        </label>

        {editing && (
          <ConfirmAction
            label="Eliminar captura"
            confirmLabel="Eliminar definitivamente"
            onConfirm={async () => {
              await deleteCatch(editing.id);
              setDone(true);
              ui.clearDraft(draftKey);
              ui.close();
              ui.toast('Captura eliminada.');
            }}
          />
        )}
      </form>
    </Sheet>
  );
}
