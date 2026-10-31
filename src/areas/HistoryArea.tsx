import { useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Feather, Fish, NotebookPen, Scale, Trophy, Waves } from 'lucide-react';
import { SPECIES, speciesById, speciesLabel } from '../data/constants';
import { formatDateShort, formatKg } from '../lib/format';
import { computeStats } from '../lib/stats';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { AreaTitle } from '../components/AreaTitle';
import { DemoBadge, Photo } from '../components/ui';
import { LiveBanner, journeyCover, journeyPlace } from '../components/journey';

export function HistoryArea() {
  const { data } = useStore();
  const { open } = useUi();
  const [year, setYear] = useState('');
  const [place, setPlace] = useState('');
  const [species, setSpecies] = useState('');

  const live = data.journeys.find((j) => j.status === 'em-curso');
  const done = useMemo(
    () => data.journeys.filter((j) => j.status === 'concluida').sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)),
    [data.journeys],
  );
  const catchesBy = useMemo(() => {
    const m = new Map<string, typeof data.catches>();
    for (const c of data.catches) m.set(c.journeyId, [...(m.get(c.journeyId) ?? []), c]);
    return m;
  }, [data.catches]);
  const stats = useMemo(() => computeStats(data.journeys, data.catches), [data.journeys, data.catches]);

  const years = [...new Set(done.map((j) => j.date.slice(0, 4)))].sort().reverse();
  const places = [...new Set(done.map((j) => journeyPlace(j)))].sort((a, b) => a.localeCompare(b, 'pt'));
  const speciesInDiary = SPECIES.filter((s) => data.catches.some((c) => c.species === s.id && done.some((j) => j.id === c.journeyId)));

  const filtered = done.filter(
    (j) =>
      (!year || j.date.startsWith(year)) &&
      (!place || journeyPlace(j) === place) &&
      (!species || (catchesBy.get(j.id) ?? []).some((c) => c.species === species)),
  );
  const bestSpecies = speciesById(stats.bestByWeight?.species);

  const addCatch = () => open({ type: 'catch', journeyId: live?.id });

  return (
    <div className="area area--history">
      <AreaTitle index={1} />
      <section className="hero hero--history">
        <Photo refId="art:night" alt="Ilustração de uma albufeira à noite, com lua e estrelas refletidas" className="hero-photo" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <h1 id="history-title">Cada jornada merece ser contada.</h1>
          <div className="btn-row">
            <button type="button" className="btn btn--action btn--lg" onClick={() => open({ type: 'log' })}>
              <NotebookPen size={20} aria-hidden="true" /> Registar jornada
            </button>
            <button type="button" className="btn btn--glass btn--lg" onClick={addCatch}>
              <Fish size={20} aria-hidden="true" /> Adicionar captura
            </button>
          </div>
        </div>
      </section>

      <div className="area-body">
        {live && <LiveBanner journey={live} catches={(catchesBy.get(live.id) ?? []).length} tone="deep" />}

        <section className="block stats-block" aria-labelledby="stats-title">
          <div className="block-head">
            <h2 id="stats-title">Evolução pessoal</h2>
            <span className="block-sub">Calculado a partir dos teus registos</span>
          </div>
          <dl className="stats">
            <div className="stat">
              <dt><BookOpen size={18} aria-hidden="true" /> Jornadas concluídas</dt>
              <dd>{stats.completedJourneys}</dd>
            </div>
            <div className="stat">
              <dt><Waves size={18} aria-hidden="true" /> Capturas registadas</dt>
              <dd>{stats.totalCatches}</dd>
            </div>
            <div className="stat">
              <dt><Trophy size={18} aria-hidden="true" /> Espécie mais frequente</dt>
              <dd className={stats.topSpecies ? '' : 'stat-empty'}>
                {stats.topSpecies ? (
                  <>
                    {speciesLabel(stats.topSpecies.id)} <small>× {stats.topSpecies.count}</small>
                  </>
                ) : (
                  'Sem dados'
                )}
              </dd>
            </div>
            <div className="stat">
              <dt><Scale size={18} aria-hidden="true" /> Melhor captura por peso</dt>
              <dd className={stats.bestByWeight ? '' : 'stat-empty'}>
                {stats.bestByWeight ? (
                  <>
                    {formatKg(stats.bestByWeight.weightKg!)} <small>{bestSpecies?.name}</small>
                  </>
                ) : (
                  'Sem peso registado'
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="block" aria-labelledby="diary-title">
          <div className="block-head">
            <h2 id="diary-title">Diário</h2>
            <span className="block-sub">{filtered.length === 1 ? '1 jornada' : `${filtered.length} jornadas`}</span>
          </div>

          {done.length > 0 && (
            <div className="filters" role="group" aria-label="Filtrar diário">
              <label className="filter">
                <span>Ano</span>
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Todos</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
              <label className="filter">
                <span>Local</span>
                <select value={place} onChange={(e) => setPlace(e.target.value)}>
                  <option value="">Todos</option>
                  {places.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="filter">
                <span>Espécie</span>
                <select value={species} onChange={(e) => setSpecies(e.target.value)}>
                  <option value="">Todas</option>
                  {speciesInDiary.map((s) => (
                    <option key={s.id} value={s.id}>{speciesLabel(s.id)}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {done.length === 0 ? (
            <div className="empty empty--deep">
              <div className="empty-art" aria-hidden="true">
                <Feather size={26} />
              </div>
              <h3>O teu diário está à espera da primeira página</h3>
              <p>Regista uma jornada que já viveste ou conclui uma jornada planeada. Uma história também se faz de paisagens e tentativas.</p>
              <button type="button" className="btn btn--primary" onClick={() => open({ type: 'log' })}>
                <NotebookPen size={18} aria-hidden="true" /> Registar jornada
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <h3>Nenhuma jornada com estes filtros</h3>
              <button type="button" className="btn btn--ghost" onClick={() => { setYear(''); setPlace(''); setSpecies(''); }}>
                Limpar filtros
              </button>
            </div>
          ) : (
            <ul className="diary">
              {filtered.map((j) => {
                const cs = catchesBy.get(j.id) ?? [];
                const sp = [...new Set(cs.map((c) => speciesLabel(c.species)))];
                const firstPhoto = cs.find((c) => c.photo)?.photo;
                return (
                  <li key={j.id}>
                    <button type="button" className="diary-card" onClick={() => open({ type: 'journey', journeyId: j.id })}>
                      <Photo refId={journeyCover(j, firstPhoto)} alt="" className="diary-photo" />
                      <span className="diary-body">
                        <span className="diary-meta">
                          <span>{formatDateShort(j.date, false)}</span>
                          {j.demo && <DemoBadge />}
                          {j.narrative && <span className="pill pill--story">História</span>}
                        </span>
                        <b className="diary-title">{journeyPlace(j)}</b>
                        <span className="diary-stats">
                          <span>
                            <Fish size={15} aria-hidden="true" /> {cs.length === 0 ? 'Sem capturas' : cs.length === 1 ? '1 captura' : `${cs.length} capturas`}
                          </span>
                          {sp.length > 0 && <span>{sp.join(', ')}</span>}
                        </span>
                        {(j.summary || j.notes) && <span className="diary-summary">{j.summary || j.notes}</span>}
                        <span className="diary-cta">
                          Ver detalhes <ChevronRight size={16} aria-hidden="true" />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
