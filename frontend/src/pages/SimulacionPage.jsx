import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Trash2, ChevronDown, Info } from 'lucide-react';
import { TeamFlag } from '../utils/flags.jsx';
import BracketView from '../components/BracketView/BracketView';
import PredictionModal from '../components/PredictionModal/PredictionModal';
import { matchesApi } from '../services/api';
import { injectSimulatedBracket, calculateGroupStandings, getAdvancingTeams } from '../utils/simulation';
import { GroupStandings } from '../components/GroupStandings/GroupStandings';
import { BestThirdsSelection } from '../components/GroupStandings/BestThirdsSelection';
import './SimulacionPage.css';

const LOCKOUT_BUFFER = 5 * 60;
const STORAGE_KEY = 'fixturemundial_simulation';
const TIEBREAKER_KEY = 'fixturemundial_tiebreakers';

const PLAYOFF_LEGEND = [
  { code: 'UEFA 1', desc: 'Italia vs Macedonia del Norte / Gales vs Austria' },
  { code: 'UEFA 2', desc: 'Suecia vs Rep. Checa / Polonia vs Rusia (X)' },
  { code: 'UEFA 3', desc: 'Portugal vs Turquía / Italia vs Macedonia' },
  { code: 'UEFA 4', desc: 'Gales vs Austria / Escocia vs Ucrania' },
  { code: 'FIFA 1', desc: 'Clasificado Repechaje Intercontinental 1' },
  { code: 'FIFA 2', desc: 'Clasificado Repechaje Intercontinental 2' },
];

const PHASES_ORDER = ['groups', 'round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'third_place', 'final'];

const PHASE_LABELS = {
  groups: '⚽ Fase de Grupos',
  round_of_32: '🔥 16avos de Final',
  round_of_16: '🔟 Octavos de Final',
  quarterfinals: '🎯 Cuartos de Final',
  semifinals: '⚡ Semifinales',
  third_place: '🥉 Tercer Puesto',
  final: '🏆 Gran Final',
};

function randomScore() {
  const r = Math.random();
  if (r < 0.35) return [1, 0];
  if (r < 0.55) return [2, 1];
  if (r < 0.65) return [1, 1];
  if (r < 0.8) return [0, 1];
  if (r < 0.9) return [2, 0];
  return [3, 1];
}

function ScoreInputSim({ value, onChange, disabled }) {
  return (
    <div className="sim-score-ctrl">
      <button type="button" className="sim-score-btn" onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0 || disabled}>-</button>
      <span className="sim-score-val">{value}</span>
      <button type="button" className="sim-score-btn sim-score-btn-add" onClick={() => onChange(value + 1)} disabled={disabled}>+</button>
    </div>
  );
}

function SimMatchCard({ match, simResult, onChange }) {
  const scoreA = simResult?.score_a ?? 0;
  const scoreB = simResult?.score_b ?? 0;
  const hasSim = simResult !== undefined;

  const getResultLabel = () => {
    if (!hasSim) return null;
    if (scoreA > scoreB) return { label: match.team_a, cls: 'sim-winner-a' };
    if (scoreB > scoreA) return { label: match.team_b, cls: 'sim-winner-b' };
    return { label: 'Empate', cls: 'sim-draw' };
  };

  const res = getResultLabel();

  return (
    <div className={`sim-match-card ${hasSim ? 'sim-match-card--set' : ''}`}>
      <div className="sim-match-teams">
        {/* Team A */}
        <div className="sim-team sim-team-a">
          <TeamFlag iso={match.flag_a} name={match.team_a} size={20} />
          <span className={`sim-team-name ${hasSim && scoreA > scoreB ? 'sim-team--winner' : ''}`}>
            {match.team_a}
          </span>
        </div>

        {/* Score controls */}
        <div className="sim-scores">
          <ScoreInputSim value={scoreA} onChange={v => onChange(match.id, v, scoreB)} />
          <span className="sim-scores-sep">-</span>
          <ScoreInputSim value={scoreB} onChange={v => onChange(match.id, scoreA, v)} />
        </div>

        {/* Team B */}
        <div className="sim-team sim-team-b">
          <span className={`sim-team-name ${hasSim && scoreB > scoreA ? 'sim-team--winner' : ''}`}>
            {match.team_b}
          </span>
          <TeamFlag iso={match.flag_b} name={match.team_b} size={20} />
        </div>
      </div>

      {hasSim && res && (
        <motion.div
          className={`sim-result-label ${res.cls}`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {scoreA > scoreB || scoreB > scoreA ? `Avanza: ${res.label}` : res.label}
        </motion.div>
      )}
    </div>
  );
}

function PhaseSection({ phase, matches, simResults, tiebreakers, onResolveTie, onChange, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const setCount = matches.filter(m => simResults[m.id] !== undefined).length;

  // Group by group_name for groups phase
  let grouped = null;
  let resolvedStandings = {};
  let tiedGroups = {};
  
  if (phase === 'groups') {
    grouped = matches.reduce((acc, m) => {
        const g = m.group_name || '?';
        if (!acc[g]) acc[g] = [];
        acc[g].push(m);
        return acc;
      }, {});
      
    const calc = calculateGroupStandings(matches, simResults, tiebreakers);
    resolvedStandings = calc.sorted;
    tiedGroups = calc.tiedGroups;
  }

  return (
    <div className="sim-phase-section">
      <button
        className="sim-phase-header"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="sim-phase-label">{PHASE_LABELS[phase] || phase}</span>
        <span className="sim-phase-count">{setCount}/{matches.length}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="sim-phase-body">
              {grouped
                ? Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([g, gMatches]) => (
                    <div key={g} className="sim-group-block">
                      <div className="sim-group-label">Grupo {g}</div>
                      {gMatches.map(m => (
                        <SimMatchCard key={m.id} match={m} simResult={simResults[m.id]} onChange={onChange} />
                      ))}
                      
                      {/* Sub-table for standings within the group */}
                      {resolvedStandings[g] && resolvedStandings[g].some(t => t.played > 0) && (
                        <GroupStandings 
                          groupName={g} 
                          teams={resolvedStandings[g]} 
                          tiedTeams={tiedGroups[g]}
                          onResolveTie={onResolveTie}
                        />
                      )}
                    </div>
                  ))
                : matches.map(m => (
                    <SimMatchCard key={m.id} match={m} simResult={simResults[m.id]} onChange={onChange} />
                  ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SimulacionPage() {
  const [matches, setMatches] = useState([]);
  const [simResults, setSimResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const [tiebreakers, setTiebreakers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TIEBREAKER_KEY) || '{}'); } catch { return {}; }
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Load matches from backend (same endpoint, no auth needed for match data)
  useEffect(() => {
    matchesApi.getAll()
      .then(res => setMatches(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(simResults));
  }, [simResults]);

  useEffect(() => {
    localStorage.setItem(TIEBREAKER_KEY, JSON.stringify(tiebreakers));
  }, [tiebreakers]);

  const handleChange = useCallback((matchId, scoreA, scoreB) => {
    setSimResults(prev => ({ ...prev, [matchId]: { score_a: scoreA, score_b: scoreB } }));
  }, []);

  const handleResolveTie = useCallback((groupOrThirds, newOrderArray) => {
    setTiebreakers(prev => ({ ...prev, [groupOrThirds]: newOrderArray }));
  }, []);

  const simulateRandom = () => {
    const updated = { ...simResults };
    matches.forEach(m => {
      const [a, b] = randomScore();
      updated[m.id] = { score_a: a, score_b: b };
    });
    setSimResults(updated);
  };

  const clearAll = () => {
    setSimResults({});
    setTiebreakers({});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIEBREAKER_KEY);
  };

  const matchesByPhase = PHASES_ORDER.reduce((acc, phase) => {
    acc[phase] = matches.filter(m => m.phase === phase);
    return acc;
  }, {});

  const totalSet = Object.keys(simResults).length;
  const totalMatches = matches.length;
  const groupsMatchesCount = matchesByPhase['groups']?.length || 0;
  
  // Calculate to see if we can show brackets
  const groupsFinishedCount = matchesByPhase['groups']?.filter(m => simResults[m.id] !== undefined).length || 0;
  const allGroupsFinished = groupsMatchesCount > 0 && groupsFinishedCount === groupsMatchesCount;
  
  let advancingData = null;
  if (allGroupsFinished) {
    const calc = calculateGroupStandings(matches, simResults, tiebreakers);
    advancingData = getAdvancingTeams(calc.sorted, tiebreakers);
  }

  return (
    <div className="sim-page page-container page-content">
      <motion.div
        className="sim-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="sim-badge">
          <Dices size={16} /> Modo Prueba
        </div>
        <h1 className="sim-title display">Simulación de Torneo</h1>
        <p className="sim-subtitle">
          Simulá el fixture completo sin afectar tus pronósticos reales.<br />
          ¡Los datos se guardan solo en tu navegador!
        </p>

        <div className="sim-info-banner">
          <Info size={14} />
          <span>Esta simulación es independiente de tus predicciones definitivas.</span>
        </div>

        <div className="sim-progress-wrap">
          <div className="sim-progress-info">
            <span>{totalSet} de {totalMatches} partidos simulados</span>
            <span className="sim-progress-pct">{totalMatches > 0 ? Math.round(totalSet / totalMatches * 100) : 0}%</span>
          </div>
          <div className="sim-progress-bar">
            <motion.div
              className="sim-progress-fill"
              animate={{ width: `${totalMatches > 0 ? (totalSet / totalMatches) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="sim-actions">
          <motion.button
            className="btn btn-primary"
            onClick={simulateRandom}
            whileTap={{ scale: 0.97 }}
          >
            <Dices size={16} /> Simular al azar
          </motion.button>
          <motion.button
            className="btn btn-ghost"
            onClick={clearAll}
            whileTap={{ scale: 0.97 }}
          >
            <Trash2 size={16} /> Limpiar
          </motion.button>
        </div>
      </motion.div>

      {loading ? (
        <div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: 8 }} />
          ))}
        </div>
      ) : (
        <>
        <div className="sim-phases">
          <PhaseSection
            phase="groups"
            matches={matchesByPhase['groups']}
            simResults={simResults}
            tiebreakers={tiebreakers}
            onResolveTie={handleResolveTie}
            onChange={handleChange}
            defaultOpen={true}
          />
          
          {/* Intermediate Bubble Step */}
          {allGroupsFinished && advancingData && (
             <BestThirdsSelection 
               allThirds={advancingData.allThirds}
               thirdsTied={advancingData.thirdsTied}
               tiedThirdTeams={advancingData.tiedThirdTeams}
               tiebreakers={tiebreakers}
               onResolveTie={handleResolveTie}
             />
          )}</div>

          <div className="sim-bracket-wrapper" style={{ marginTop: 32 }}>
            <div className="bracket-wrapper-inner" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
              <h2 className="sim-bracket-title">Fase Eliminatoria</h2>
            
            {!allGroupsFinished ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)' }}>
                ⚽ Completá todos los partidos de la Fase de Grupos para poder visualizar la Fase Eliminatoria.
              </div>
            ) : advancingData.thirdsTied ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)' }}>
                ⚠️ Debes resolver el empate de los Mejores Terceros en la tabla superior antes de generar las llaves.
              </div>
            ) : (
              <div className="bracket-knockout-scroll">
                <BracketView 
                   matchesByPhase={injectSimulatedBracket(matches, simResults, tiebreakers).reduce((acc, m) => {
                     acc[m.phase] = acc[m.phase] || [];
                     acc[m.phase].push(m);
                     return acc;
                   }, {})} 
                   onOpenModal={setSelectedMatch} 
                   isSimMode={true} 
                   simResults={simResults}
                   onSimChange={handleChange}
                />
              </div>
            )}
            </div>
          </div>
        </>
      )}

      <div className="playoff-legend" style={{ marginTop: 40, padding: 20, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Leyenda de Clasificatorias Pendientes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '8px 16px' }}>
          <div><strong>UEFA 1:</strong> Italy vs. Northern Ireland / Wales vs. Bosnia and Herzegovina</div>
          <div><strong>UEFA 2:</strong> Ukraine vs. Sweden / Poland vs. Albania</div>
          <div><strong>UEFA 3:</strong> Turkey vs. Romania / Slovakia vs. Kosovo</div>
          <div><strong>UEFA 4:</strong> Denmark vs. North Macedonia / Czech Republic vs. Ireland</div>
          <div><strong>FIFA 1:</strong> Jamaica vs. New Caledonia - Congo</div>
          <div><strong>FIFA 2:</strong> Bolivia vs. Suriname - Iraq</div>
        </div>
      </div>

      {selectedMatch && (
        <PredictionModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSave={(prediction) => handleChange(prediction.match_id, prediction.score_a, prediction.score_b)}
          isSimMode={true}
          simResult={simResults[selectedMatch.id]}
        />
      )}
    </div>
  );
}
