import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import type { Journey, Modality, SpeciesId } from '../types';
import { MODALITIES, SPECIES, SPOTS, TECHNIQUES, speciesLabel, spotById } from '../data/constants';
import { todayISO, uid } from '../lib/format';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Sheet } from '../components/Sheet';
import { Chips, Field, Segmented } from '../components/ui';

interface Draft {
  spotId: string; // id do local ou 'outro'
  customLocation: string;
  date: string;
  startTime: string;
  targetSpecies: SpeciesId | '';
  modality: Modality;
  techniques: string[];
  notes: string;
}

export function PlannerSheet({ journeyId, spotId, top }: { journeyId?: string; spotId?: string; top: boolean }) {
  const { data, upsertJourney } = useStore();
  const ui = useUi();
  const editing = data.journeys.find((j) => j.id === journeyId);
  const draftKey = `planner:${journeyId ?? 'new'}`;

  const [d, setD] = useState<Draft>(() => {
    const saved = ui.draft<Draft>(draftKey);
    if (saved && !spotId) return saved;
    if (editing)
      return {
        spotId: editing.spotId ?? 'outro',
        customLocation: editing.spotId ? '' : editing.locationName,
        date: editing.date,
        startTime: editing.startTime,
        targetSpecies: editing.targetSpecies ?? '',
        modality: editing.modality,
        techniques: editing.techniques,
        notes: editing.notes,
      };
    return {
      spotId: spotId ?? '',
      customLocation: '',
      date: '',
      startTime: '07:00',
      targetSpecies: '',
      modality: 'margem',
      techniques: [],
      notes: '',
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Guarda o rascunho em memória para não se perder ao fechar sem querer.
  useEffect(() => {
    if (!saved) ui.setDraft(draftKey, d);
  }, [d, draftKey, saved, ui]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!d.spotId) e.spotId = 'Escolhe um local.';
    if (d.spotId === 'outro' && d.customLocation.trim().length < 2) e.customLocation = 'Escreve o nome do local.';
    if (!d.date) e.date = 'Escolhe a data.';
    else if (!editing && d.date < todayISO()) e.date = 'Para jornadas passadas usa “Registar jornada” em Gera a tua história.';
    if (!/^\d{2}:\d{2}$/.test(d.startTime)) e.startTime = 'Indica a hora de início.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      ui.toast('Revê os campos assinalados.', 'error');
      return;
    }
    const spot = spotById(d.spotId);
    const base: Journey = editing ?? {
      id: uid('j'),
      status: 'planeada',
      origin: 'plano',
      locationPrivate: true,
      checklist: {},
      customChecklist: [],
      createdAt: new Date().toISOString(),
      locationName: '',
      date: d.date,
      startTime: d.startTime,
      modality: d.modality,
      techniques: [],
      notes: '',
    };
    const j: Journey = {
      ...base,
      spotId: spot?.id,
      locationName: spot?.name ?? d.customLocation.trim(),
      date: d.date,
      startTime: d.startTime,
      targetSpecies: d.targetSpecies || undefined,
      modality: d.modality,
      techniques: d.techniques,
      notes: d.notes.trim(),
    };
    upsertJourney(j);
    setSaved(true);
    ui.clearDraft(draftKey);
    ui.toast(editing ? 'Plano atualizado.' : 'Jornada planeada. A checklist já está pronta.');
    if (editing) ui.close();
    else ui.replace({ type: 'plan', journeyId: j.id });
  };

  return (
    <Sheet
      top={top}
      title={editing ? 'Editar plano' : 'Planear jornada'}
      eyebrow="Prepara a tua jornada"
      onClose={ui.close}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={ui.close}>
            Cancelar
          </button>
          <button type="submit" form="planner-form" className="btn btn--primary">
            {editing ? 'Guardar alterações' : 'Guardar jornada'}
          </button>
        </>
      }
    >
      <form id="planner-form" className="form" onSubmit={submit} noValidate>
        <Field label="Local" htmlFor="pl-spot" error={errors.spotId}>
          <select id="pl-spot" value={d.spotId} onChange={(e) => set('spotId', e.target.value)} data-autofocus>
            <option value="">Escolhe um local…</option>
            {SPOTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.region}
              </option>
            ))}
            <option value="outro">Outro local (escrever)</option>
          </select>
        </Field>
        {d.spotId === 'outro' && (
          <Field label="Nome do local" htmlFor="pl-loc" error={errors.customLocation} hint="Escreve o nome como o reconheces. Não usamos a tua localização.">
            <input id="pl-loc" value={d.customLocation} onChange={(e) => set('customLocation', e.target.value)} placeholder="Ex.: Albufeira do Maranhão" maxLength={80} />
          </Field>
        )}
        <p className="privacy-note">
          <Lock size={14} aria-hidden="true" /> A localização das jornadas é privada por defeito e fica só neste dispositivo.
        </p>

        <div className="form-row">
          <Field label="Data" htmlFor="pl-date" error={errors.date}>
            <input id="pl-date" type="date" value={d.date} min={editing ? undefined : todayISO()} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Hora de início" htmlFor="pl-time" error={errors.startTime}>
            <input id="pl-time" type="time" value={d.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </Field>
        </div>

        <Field label="Espécie-alvo" htmlFor="pl-species" optional>
          <select id="pl-species" value={d.targetSpecies} onChange={(e) => set('targetSpecies', e.target.value as SpeciesId | '')}>
            <option value="">Sem preferência</option>
            {SPECIES.map((s) => (
              <option key={s.id} value={s.id}>
                {speciesLabel(s.id)}
              </option>
            ))}
          </select>
        </Field>

        <Segmented label="Modalidade" value={d.modality} options={MODALITIES.map((m) => ({ id: m.id, label: m.label }))} onChange={(v) => set('modality', v)} />

        <Chips
          label="Técnicas ou amostras preferidas"
          values={d.techniques}
          options={TECHNIQUES}
          onToggle={(t) => set('techniques', d.techniques.includes(t) ? d.techniques.filter((x) => x !== t) : [...d.techniques, t])}
        />

        <Field label="Notas pessoais" htmlFor="pl-notes" optional>
          <textarea id="pl-notes" rows={3} value={d.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Zonas a explorar, com quem vais, o que queres testar…" maxLength={600} />
        </Field>
      </form>
    </Sheet>
  );
}
