import { CalendarDays, ChevronRight, Clock, Compass, Fish, MapPin, Play, Plus, Sailboat } from 'lucide-react';
import { SPOTS, modalityLabel, speciesLabel } from '../data/constants';
import { formatDateShort, relativeDay, todayISO } from '../lib/format';
import { selectNextJourney, useStore } from '../state/store';
import { useUi } from '../state/ui';
import { DemoBadge, Photo, ProgressBar } from '../components/ui';
import { Checklist, ConditionsPanel, LiveBanner, SuggestionsList, journeyCover, journeyPlace, prepState } from '../components/journey';

export function PrepareArea() {
  const { data } = useStore();
  const { open, toast } = useUi();
  const next = selectNextJourney(data.journeys);
  const live = data.journeys.find((j) => j.status === 'em-curso');
  const others = data.journeys
    .filter((j) => j.status === 'planeada' && j.id !== next?.id)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const st = next ? prepState(next) : null;
  const { startJourney } = useStore();

  const start = () => {
    if (!next) return;
    if (live && live.id !== next.id) {
      toast('Já tens uma jornada em curso. Conclui-a antes de iniciar outra.', 'error');
      return;
    }
    startJourney(next.id);
    toast(next.date === todayISO() ? 'Jornada iniciada. Boa pesca!' : 'Jornada iniciada hoje (a data do plano foi ajustada).');
  };

  return (
    <div className="area area--prepare">
      <section className="hero hero--prepare">
        <Photo refId="art:dawn" alt="Ilustração de uma albufeira ao amanhecer, com encostas de pinhal refletidas na água" className="hero-photo" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow eyebrow--light">Prepara a tua jornada</p>
          <h1 id="prepare-title">A próxima grande história começa aqui.</h1>
          <button type="button" className="btn btn--action btn--lg" onClick={() => open({ type: 'planner' })}>
            <Compass size={20} aria-hidden="true" /> Planear jornada
          </button>
        </div>
      </section>

      <div className="area-body">
        {live && <LiveBanner journey={live} catches={data.catches.filter((c) => c.journeyId === live.id).length} />}

        <div className="layout-2col">
          <div className="col">
            <section className="block" aria-labelledby="next-title">
              <div className="block-head">
                <h2 id="next-title">{next?.status === 'em-curso' ? 'Jornada atual' : 'Próxima jornada'}</h2>
                {next?.demo && <DemoBadge />}
              </div>
              {next && st ? (
                <article className="next-card">
                  <Photo refId={journeyCover(next)} alt={`Paisagem de ${journeyPlace(next)}`} className="next-photo" />
                  <div className="next-body">
                    <div className="next-top">
                      <span className="pill pill--soft">{next.status === 'em-curso' ? 'Em curso' : relativeDay(next.date)}</span>
                      <span className={`pill pill--${st.label === 'Pronta' ? 'ok' : 'muted'}`}>{st.label}</span>
                    </div>
                    <h3>{journeyPlace(next)}</h3>
                    <dl className="facts">
                      <div className="span-2">
                        <dt><CalendarDays size={16} aria-hidden="true" /><span className="visually-hidden">Data e hora</span></dt>
                        <dd>
                          {formatDateShort(next.date)} <span className="dot-sep">·</span> <Clock size={14} aria-hidden="true" className="inline-icon" /> {next.startTime}
                        </dd>
                      </div>
                      <div>
                        <dt><Fish size={16} aria-hidden="true" /><span className="visually-hidden">Espécie-alvo</span></dt>
                        <dd>{speciesLabel(next.targetSpecies)}</dd>
                      </div>
                      <div>
                        <dt><Sailboat size={16} aria-hidden="true" /><span className="visually-hidden">Modalidade</span></dt>
                        <dd>{modalityLabel(next.modality)}</dd>
                      </div>
                    </dl>
                    <div className="prep-line">
                      <span>Preparação {st.done}/{st.total}</span>
                      <ProgressBar value={st.done} max={st.total} label="Estado da preparação" />
                    </div>
                    <div className="btn-row">
                      <button type="button" className="btn btn--primary" onClick={() => open({ type: 'plan', journeyId: next.id })}>
                        Ver plano <ChevronRight size={18} aria-hidden="true" />
                      </button>
                      {next.status === 'planeada' && (
                        <button type="button" className="btn btn--ghost" onClick={start}>
                          <Play size={16} aria-hidden="true" /> Iniciar jornada
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ) : (
                <div className="empty">
                  <div className="empty-art" aria-hidden="true">
                    <MapPin size={26} />
                  </div>
                  <h3>Ainda não há jornada planeada</h3>
                  <p>Escolhe um local, a data e a espécie-alvo. A CatchAtlas prepara a checklist e as sugestões para ti.</p>
                  <button type="button" className="btn btn--primary" onClick={() => open({ type: 'planner' })}>
                    <Plus size={18} aria-hidden="true" /> Criar a primeira jornada
                  </button>
                </div>
              )}

              {others.length > 0 && (
                <ul className="mini-list" aria-label="Outras jornadas planeadas">
                  {others.map((j) => (
                    <li key={j.id}>
                      <button type="button" className="mini-row" onClick={() => open({ type: 'plan', journeyId: j.id })}>
                        <span className="mini-date">
                          <b>{formatDateShort(j.date, false).split(' ')[0]}</b>
                          {formatDateShort(j.date, false).split(' ')[1]}
                        </span>
                        <span className="mini-main">
                          <b>{journeyPlace(j)}</b>
                          <small>
                            {j.startTime} · {speciesLabel(j.targetSpecies)} · {modalityLabel(j.modality)}
                          </small>
                        </span>
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {next && (
              <section className="block" aria-labelledby="cond-title">
                <div className="block-head">
                  <h2 id="cond-title">Condições da jornada</h2>
                  <span className="badge badge--demo">Demonstração</span>
                </div>
                <ConditionsPanel journey={next} />
              </section>
            )}

            {next && (
              <section className="block" aria-labelledby="sug-title">
                <div className="block-head">
                  <h2 id="sug-title">Sugestões de preparação</h2>
                </div>
                <SuggestionsList journey={next} limit={4} />
              </section>
            )}
          </div>

          <div className="col">
            {next && (
              <section className="block" aria-labelledby="check-title">
                <div className="block-head">
                  <h2 id="check-title">Checklist</h2>
                  <span className="block-sub">{journeyPlace(next)}</span>
                </div>
                <Checklist journey={next} />
              </section>
            )}

            <section className="block" aria-labelledby="spots-title">
              <div className="block-head">
                <h2 id="spots-title">Locais para explorar</h2>
                <DemoBadge />
              </div>
              <ul className="spot-grid">
                {SPOTS.map((s) => (
                  <li key={s.id}>
                    <button type="button" className="spot-card" onClick={() => open({ type: 'spot', spotId: s.id })}>
                      <Photo refId={s.art} alt="" className="spot-photo" />
                      <span className="spot-text">
                        <b>{s.name}</b>
                        <small>
                          {s.river} · {s.region}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="fine">
                Descrições genéricas e ilustrações demonstrativas. Acessos, licenças e restrições devem ser confirmados junto das
                entidades oficiais.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
