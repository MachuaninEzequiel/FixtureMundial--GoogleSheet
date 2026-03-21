import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Check } from 'lucide-react';
import { predictionsApi } from '../../services/api';
import { TeamFlag } from '../../utils/flags.jsx';
import './PredictionModal.css';

const PHASE_LABELS = {
  groups: 'Fase de Grupos',
  round_of_32: '16avos de Final',
  round_of_16: 'Octavos de Final',
  quarterfinals: 'Cuartos de Final',
  semifinals: 'Semifinal',
  third_place: 'Tercer Puesto',
  final: 'Gran Final 🏆',
};

function ScoreInput({ value, onChange, teamName, flagIso, id }) {
  return (
    <div className="score-block">
      <div className="score-team-info">
        <TeamFlag iso={flagIso} name={teamName} size={26} />
        <span className="score-team-name">{teamName}</span>
      </div>
      <div className="score-controls">
        <button
          type="button"
          className="score-btn"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Restar gol a ${teamName}`}
          disabled={value <= 0}
        >
          <Minus size={18} />
        </button>
        <span className="score-value" aria-live="polite" aria-label={`Goles de ${teamName}: ${value}`}>
          {value}
        </span>
        <button
          type="button"
          className="score-btn score-btn-add"
          onClick={() => onChange(value + 1)}
          aria-label={`Agregar gol a ${teamName}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

export default function PredictionModal({ match, onClose, onSave, isSimMode, simResult }) {
  const initialA = isSimMode ? (simResult?.score_a ?? 0) : (match.userPrediction?.score_a ?? 0);
  const initialB = isSimMode ? (simResult?.score_b ?? 0) : (match.userPrediction?.score_b ?? 0);
  const [scoreA, setScoreA] = useState(initialA);
  const [scoreB, setScoreB] = useState(initialB);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const LOCKOUT_BUFFER = 5 * 60;
  const isLocked = match.match_date && Math.floor(Date.now() / 1000) >= match.match_date - LOCKOUT_BUFFER;

  const getResult = () => {
    if (scoreA > scoreB) return { label: `Gana ${match.team_a}`, icon: '🏆', cls: 'result-a' };
    if (scoreB > scoreA) return { label: `Gana ${match.team_b}`, icon: '🏆', cls: 'result-b' };
    return { label: 'Empate', icon: '🤝', cls: 'result-draw' };
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Trap focus inside modal
  useEffect(() => {
    const firstFocusable = document.querySelector('.modal-close');
    firstFocusable?.focus();
  }, []);

  const handleSave = async () => {
    if (isLocked && !isSimMode) return;
    setError('');
    setLoading(true);

    if (isSimMode) {
      setSaved(true);
      setTimeout(() => {
        onSave({ match_id: match.id, score_a: scoreA, score_b: scoreB });
        onClose();
      }, 500);
      return;
    }

    try {
      const { data } = await predictionsApi.save({
        match_id: match.id,
        score_a: scoreA,
        score_b: scoreB,
      });
      setSaved(true);
      setTimeout(() => {
        onSave(data.prediction);
        onClose();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el pronóstico');
    } finally {
      setLoading(false);
    }
  };

  const result = getResult();
  const matchDate = match.match_date ? new Date(match.match_date * 1000).toLocaleString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  }) : 'Por determinar';

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-label={`Pronóstico: ${match.team_a} vs ${match.team_b}`}
      >
        <motion.div
          className="modal-content"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="modal-phase-badge">
              {PHASE_LABELS[match.phase] || match.phase}
              {match.group_name && ` · Grupo ${match.group_name}`}
            </div>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="modal-date">{matchDate}</div>
          {match.venue && <div className="modal-venue">📍 {match.venue}</div>}

          {/* Match vs display */}
          <div className="modal-vs">
            <div className="vs-team">
              <TeamFlag iso={match.flag_a} name={match.team_a} size={40} />
              <span className="vs-name">{match.team_a}</span>
            </div>
            <div className="vs-separator">VS</div>
            <div className="vs-team vs-team-b">
              <TeamFlag iso={match.flag_b} name={match.team_b} size={40} />
              <span className="vs-name">{match.team_b}</span>
            </div>
          </div>

          {isLocked && !isSimMode ? (
            <div className="modal-locked">
              <span>🔒</span>
              <p>Las predicciones están cerradas<br/>(cierra 5 min antes del inicio).</p>
              {match.userPrediction && (
                <div className="locked-prediction">
                  Tu pronóstico: <strong>{match.userPrediction.score_a} - {match.userPrediction.score_b}</strong>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Score inputs */}
              <div className="modal-scores">
                <ScoreInput value={scoreA} onChange={setScoreA} teamName={match.team_a} flagIso={match.flag_a} />
                <div className="scores-divider">-</div>
                <ScoreInput value={scoreB} onChange={setScoreB} teamName={match.team_b} flagIso={match.flag_b} />
              </div>

              {/* Result preview */}
              <motion.div
                className={`result-preview ${result.cls}`}
                key={result.label}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <span>{result.icon}</span>
                <span>{result.label}</span>
              </motion.div>

              {error && <p className="error-text" role="alert" style={{ textAlign: 'center' }}>{error}</p>}

              {/* Save button with check animation */}
              <motion.button
                className="btn btn-primary btn-full modal-save-btn"
                onClick={handleSave}
                disabled={loading || saved}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="modal-check"
                    >
                      <Check size={20} /> ¡Guardado!
                    </motion.span>
                  ) : loading ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <span className="spinner-sm" /> Guardando...
                    </motion.span>
                  ) : (
                    <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Guardar pronóstico
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
