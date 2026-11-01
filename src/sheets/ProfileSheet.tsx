import { useState } from 'react';
import { Database, Lock, RotateCcw, Sparkles } from 'lucide-react';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Sheet } from '../components/Sheet';
import { ConfirmAction } from '../components/ConfirmAction';
import { Field, Segmented } from '../components/ui';
import { computeStats } from '../lib/stats';

export function ProfileSheet({ top }: { top: boolean }) {
  const { data, prefs, setPrefs, setProfile, clearDemo, loadDemo, resetAll, saveError } = useStore();
  const ui = useUi();
  const [name, setName] = useState(data.profile.name);
  const [region, setRegion] = useState(data.profile.region);
  const demoCount = data.journeys.filter((j) => j.demo).length;
  const stats = computeStats(data.journeys, data.catches);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ name: name.trim(), region: region.trim() });
    ui.toast('Perfil guardado.');
  };

  return (
    <Sheet top={top} title="Perfil e definições" eyebrow="CatchAtlas" onClose={ui.close}>
      <div className="profile">
        <form className="form" onSubmit={save}>
          <div className="form-row">
            <Field label="Nome" htmlFor="pf-name" optional>
              <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" />
            </Field>
            <Field label="Região habitual" htmlFor="pf-region" optional>
              <input id="pf-region" value={region} onChange={(e) => setRegion(e.target.value)} maxLength={40} placeholder="Ex.: Ribatejo" />
            </Field>
          </div>
          <button type="submit" className="btn btn--primary btn--sm">Guardar perfil</button>
        </form>

        <p className="profile-summary">
          {stats.completedJourneys} jornadas concluídas · {stats.totalCatches} capturas · {data.journeys.filter((j) => j.status === 'planeada').length} planeadas
        </p>

        <h3 className="sub-title">Movimento</h3>
        <Segmented
          label="Transição entre áreas"
          value={prefs.motion}
          options={[
            { id: 'system', label: 'Seguir o sistema' },
            { id: 'reduce', label: 'Reduzido' },
          ]}
          onChange={(v) => setPrefs({ motion: v })}
        />

        <h3 className="sub-title">Privacidade</h3>
        <p className="callout callout--soft">
          <Lock size={18} aria-hidden="true" />
          <span>
            Os locais das jornadas são privados por defeito. A CatchAtlas não pede a tua geolocalização: escreves o local manualmente.
            Todos os dados ficam apenas neste dispositivo (localStorage e IndexedDB), sem conta nem servidor.
          </span>
        </p>
        {saveError && (
          <p className="callout callout--error" role="alert">
            Não foi possível guardar os dados neste navegador (armazenamento cheio ou bloqueado).
          </p>
        )}

        <h3 className="sub-title">Dados demonstrativos</h3>
        <p className="muted">
          {demoCount > 0
            ? `Há ${demoCount} jornadas de exemplo, assinaladas com “Exemplo”.`
            : 'Não há exemplos carregados.'}
        </p>
        <div className="btn-col">
          {demoCount > 0 ? (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                clearDemo();
                ui.toast('Exemplos removidos. Começas do zero.');
              }}
            >
              <Sparkles size={16} aria-hidden="true" /> Limpar exemplos e começar do zero
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                loadDemo();
                ui.toast('Exemplos carregados.');
              }}
            >
              <RotateCcw size={16} aria-hidden="true" /> Carregar exemplos
            </button>
          )}
          <ConfirmAction
            label="Apagar todos os dados"
            confirmLabel="Apagar tudo"
            description="Apaga jornadas, capturas, histórias e fotografias guardadas neste dispositivo."
            onConfirm={async () => {
              await resetAll();
              ui.closeAll();
              ui.toast('Todos os dados foram apagados.');
            }}
          />
        </div>
        <p className="fine">
          <Database size={12} aria-hidden="true" /> Protótipo CatchAtlas · condições, sugestões comunitárias e ilustrações de locais são demonstrativas.
        </p>
      </div>
    </Sheet>
  );
}
