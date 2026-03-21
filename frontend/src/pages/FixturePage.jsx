import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lock, TrendingUp, LayoutList, Network, Timer } from 'lucide-react';
import { matchesApi, predictionsApi } from '../services/api';
import { TeamFlag } from '../utils/flags.jsx';
import { useCountdown } from '../hooks/useCountdown';
import PredictionModal from '../components/PredictionModal/PredictionModal';
import BracketView from '../components/BracketView/BracketView';
import './FixturePage.css';

const LOCKOUT_BUFFER = 5 * 60; // 5 minutes

const PHASES = [
  { key: 'groups', label: 'Fase de Grupos', icon: '⚽' },
  { key: 'round_of_32', label: '16avos de Final', icon: '🔥' },
  { key: 'round_of_16', label: 'Octavos de Final', icon: '🔟' },
  { key: 'quarterfinals', label: 'Cuartos de Final', icon: '🎯' },
  { key: 'semifinals', label: 'Semifinales', icon: '⚡' },
  { key: 'third_place', label: 'Tercer Puesto', icon: '🥉' },
  { key: 'final', label: 'Gran Final', icon: '🏆' },
];

function getOutcomeBadge(pred, match) {
  if (!pred) return null;
  if (match.real_score_a === null || match.real_score_a === undefined) return null;
  if (pred.points_earned === 3) return { label: '+3 pts', cls: 'badge-green' };
  return { label: '0 pts', cls: 'badge-red' };
}

// Countdown display for a specific match
function CountdownBadge({ matchDate }) {
  const lockTarget = matchDate - LOCKOUT_BUFFER;
  const { isLocked, display } = useCountdown(lockTarget);

  if (isLocked || !display) return null;

  const isUrgent = (lockTarget - Date.now() / 1000) < 600; // < 10 min

  return (
    <span className={`countdown-badge ${isUrgent ? 'countdown-urgent' : ''}`}>
      <Timer size={10} />
      {display}
    </span>
  );
}

function MatchCard({ match, onOpenModal }) {
  const pred = match.userPrediction;
  const now = Math.floor(Date.now() / 1000);
  const isLocked = match.match_date && now >= match.match_date - LOCKOUT_BUFFER;
  const hasResult = match.real_score_a !== null && match.real_score_a !== undefined;
  const outcomeBadge = getOutcomeBadge(pred, match);

  const matchDate = match.match_date
    ? new Date(match.match_date * 1000).toLocaleString('es-AR', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      })
    : 'Por confirmar';

  return (
    <motion.button
      className={`match-card ${pred ? 'match-card--predicted' : ''} ${isLocked ? 'match-card--locked' : ''} ${hasResult ? 'match-card--finished' : ''}`}
      onClick={() => onOpenModal(match)}
      whileHover={{ scale: isLocked && !pred ? 1 : 1.01, y: isLocked && !pred ? 0 : -2 }}
      whileTap={{ scale: 0.99 }}
      aria-label={`${match.team_a} vs ${match.team_b}. ${pred ? `Tu pronóstico: ${pred.score_a}-${pred.score_b}` : 'Hacer pronóstico'}`}
    >
      <div className="match-card-meta">
        <span className="match-date">{matchDate}</span>
        <div className="match-meta-right">
          {!isLocked && match.match_date && (
            <CountdownBadge matchDate={match.match_date} />
          )}
          {isLocked && !hasResult && <Lock size={11} className="lock-icon" />}
          {outcomeBadge && <span className={`badge ${outcomeBadge.cls}`}>{outcomeBadge.label}</span>}
        </div>
      </div>

      <div className="match-teams">
        {/* Team A — left aligned */}
        <div className="match-team match-team-a">
          <TeamFlag iso={match.flag_a} name={match.team_a} size={22} />
          <span className="team-name">{match.team_a}</span>
        </div>

        {/* Score center */}
        <div className="match-score-display">
          {hasResult ? (
            <span className="real-score">{match.real_score_a} - {match.real_score_b}</span>
          ) : pred ? (
            <span className="pred-score">{pred.score_a} - {pred.score_b}</span>
          ) : (
            <span className="score-placeholder">? - ?</span>
          )}
        </div>

        {/* Team B — right aligned, name BEFORE flag */}
        <div className="match-team match-team-b">
          <span className="team-name">{match.team_b}</span>
          <TeamFlag iso={match.flag_b} name={match.team_b} size={22} />
        </div>
      </div>

      {pred && !hasResult && (
        <div className="pred-indicator">
          <TrendingUp size={11} />
          <span>Pronóstico registrado</span>
        </div>
      )}
      {hasResult && pred && (
        <div className="pred-indicator">
          <span style={{ fontSize: '0.7rem' }}>Tu pronóstico: {pred.score_a} - {pred.score_b}</span>
        </div>
      )}
    </motion.button>
  );
}

function GroupSection({ groupName, matches, onOpenModal }) {
  return (
    <div className="group-section">
      <div className="group-header">
        <span className="group-label">Grupo {groupName}</span>
        <span className="group-count">{matches.filter(m => m.userPrediction).length}/{matches.length}</span>
      </div>
      <div className="group-matches">
        {matches.map(m => <MatchCard key={m.id} match={m} onOpenModal={onOpenModal} />)}
      </div>
    </div>
  );
}

function PhaseAccordion({ phase, matches, onOpenModal, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const predicted = matches.filter(m => m.userPrediction).length;

  return (
    <div className="phase-accordion">
      <button
        className="phase-accordion-header"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={`phase-${phase.key}`}
      >
        <span className="phase-icon">{phase.icon}</span>
        <span className="phase-label">{phase.label}</span>
        <span className="phase-progress">{predicted}/{matches.length}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`phase-${phase.key}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="phase-accordion-body">
              {phase.key === 'groups' ? (
                Object.entries(
                  matches.reduce((acc, m) => {
                    const g = m.group_name || '?';
                    if (!acc[g]) acc[g] = [];
                    acc[g].push(m);
                    return acc;
                  }, {})
                ).sort(([a], [b]) => a.localeCompare(b)).map(([g, gMatches]) => (
                  <GroupSection key={g} groupName={g} matches={gMatches} onOpenModal={onOpenModal} />
                ))
              ) : (
                <div className="knockout-matches">
                  {matches.map(m => <MatchCard key={m.id} match={m} onOpenModal={onOpenModal} />)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FixturePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'bracket'

  const fetchData = useCallback(async () => {
    try {
      // Fetch matches (public) and user predictions (authenticated) in parallel
      const [matchesRes, predsRes] = await Promise.all([
        matchesApi.getAll(),
        predictionsApi.getAll(),
      ]);

      // Build a map of match_id → prediction for O(1) lookup
      const predsMap = {};
      predsRes.data.forEach((p) => { predsMap[p.match_id] = p; });

      // Inject userPrediction into each match (same shape as before)
      setMatches(matchesRes.data.map((m) => ({
        ...m,
        userPrediction: predsMap[m.id] || null,
      })));
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError('Error al cargar el fixture: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = (updatedPrediction) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === updatedPrediction.match_id
          ? { ...m, userPrediction: updatedPrediction }
          : m
      )
    );
  };

  const matchesByPhase = PHASES.reduce((acc, phase) => {
    acc[phase.key] = matches.filter(m => m.phase === phase.key);
    return acc;
  }, {});

  const totalPredicted = matches.filter(m => m.userPrediction).length;
  const totalMatches = matches.length;

  return (
    <div className={`fixture-page ${viewMode === 'bracket' ? 'fixture-page--bracket' : ''} page-container page-content`}>
      {/* Hero */}
      <motion.div
        className="fixture-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="fixture-title display">Fixture Mundial 2026</h1>
        <p className="fixture-subtitle">Hacé clic en cualquier partido para registrar tu pronóstico</p>

        {!loading && (
          <div className="fixture-progress-bar-wrap">
            <div className="fixture-progress-info">
              <span>{totalPredicted} de {totalMatches} pronósticos</span>
              <span className="fixture-progress-pct">{Math.round(totalPredicted / totalMatches * 100)}%</span>
            </div>
            <div className="fixture-progress-bar">
              <motion.div
                className="fixture-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(totalPredicted / totalMatches) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="view-toggle" role="group" aria-label="Modo de visualización">
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
          >
            <LayoutList size={16} /> Lista
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'bracket' ? 'active' : ''}`}
            onClick={() => setViewMode('bracket')}
            aria-pressed={viewMode === 'bracket'}
          >
            <Network size={16} /> Bracket
          </button>
        </div>
      </motion.div>

      {error && <p style={{ color: 'var(--color-red)', textAlign: 'center', marginTop: 24 }}>{error}</p>}

      {loading ? (
        <div className="fixture-loading">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list"
              className="phases-list"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {PHASES.filter(p => matchesByPhase[p.key]?.length > 0).map((phase, i) => (
                <motion.div
                  key={phase.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  <PhaseAccordion
                    phase={phase}
                    matches={matchesByPhase[phase.key]}
                    onOpenModal={setSelectedMatch}
                    defaultOpen={phase.key === 'groups'}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="bracket"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <BracketView
                matchesByPhase={matchesByPhase}
                onOpenModal={setSelectedMatch}
              />
            </motion.div>
          )}
        </AnimatePresence>
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

      <AnimatePresence>
        {selectedMatch && (
          <PredictionModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
