import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, Clock } from 'lucide-react';
import { predictionsApi, matchesApi, rankingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TeamFlag } from '../utils/flags';
import './ProfilePage.css';

const PHASE_LABELS = {
  groups: 'Grupos',
  round_of_32: '16avos',
  round_of_16: 'Octavos',
  quarterfinals: 'Cuartos',
  semifinals: 'Semi',
  third_place: '3er Puesto',
  final: 'Final',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [matchesMap, setMatchesMap] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';

  useEffect(() => {
    Promise.all([
      predictionsApi.getAll(),
      matchesApi.getAll(),
      rankingApi.get(),
    ])
      .then(([predsRes, matchesRes, rankingRes]) => {
        setPredictions(predsRes.data);

        // Build a map of match_id → match for easy lookup
        const map = {};
        matchesRes.data.forEach((m) => { map[m.id] = m; });
        setMatchesMap(map);

        // Find the current user's points from the ranking
        const myEntry = rankingRes.data.find((r) => r.email === user?.email);
        setTotalPoints(myEntry?.total_points || 0);
      })
      .finally(() => setLoading(false));
  }, [user?.email]);

  // Compute stats using match data
  const correct = predictions.filter((p) => {
    const m = matchesMap[p.match_id];
    return m && m.real_score_a !== null && p.score_a === m.real_score_a && p.score_b === m.real_score_b;
  }).length;

  const finished = predictions.filter((p) => {
    const m = matchesMap[p.match_id];
    return m && m.real_score_a !== null;
  }).length;

  const pending = predictions.length - finished;

  return (
    <div className="profile-page page-container page-content">
      {/* User card */}
      <motion.div
        className="profile-card card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="profile-avatar-wrap">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="profile-avatar profile-avatar--photo"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="profile-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{displayName}</h1>
          <p className="profile-email">{user?.email}</p>
        </div>
        <div className="profile-points">
          <Trophy size={20} className="profile-points-icon" />
          <span className="profile-points-value">{totalPoints}</span>
          <span className="profile-points-label">puntos</span>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="profile-stats">
        {[
          { label: 'Pronósticos', value: predictions.length, icon: '📋', cls: '' },
          { label: 'Correctos', value: correct, icon: '✅', cls: 'stat-green' },
          { label: 'Partidos terminados', value: finished, icon: '🏁', cls: '' },
          { label: 'Partidos pendientes', value: pending, icon: '⏳', cls: '' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            className={`stat-card ${s.cls}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Predictions list */}
      <h2 className="predictions-heading">Mis Pronósticos</h2>

      {loading ? (
        <div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 8 }} />
          ))}
        </div>
      ) : predictions.length === 0 ? (
        <div className="predictions-empty">
          <span></span>
          <p>Todavía no hiciste ningún pronóstico. ¡Comenzá ahora desde el fixture!</p>
        </div>
      ) : (
        <div className="predictions-list">
          {predictions.map((pred, i) => {
            const match = matchesMap[pred.match_id] || {};
            const isFinished = match.real_score_a !== null && match.real_score_a !== undefined;
            const isCorrect = isFinished && pred.score_a === match.real_score_a && pred.score_b === match.real_score_b;

            return (
              <motion.div
                key={`${pred.email}-${pred.match_id}`}
                className={`pred-item ${isFinished ? (isCorrect ? 'pred-item--correct' : 'pred-item--wrong') : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
              >
                <div className="pred-item-phase">
                  <span className="badge badge-gray">{PHASE_LABELS[match.phase] || match.phase}</span>
                  {match.group_name && <span className="pred-group">G{match.group_name}</span>}
                </div>

                <div className="pred-item-teams">
                  <span className="pred-flag"><TeamFlag iso={match.flag_a} name={match.team_a} size={16} /></span>
                  <span className="pred-team">{match.team_a}</span>
                  <span className="pred-vs-score">{pred.score_a} - {pred.score_b}</span>
                  <span className="pred-team pred-team-b">{match.team_b}</span>
                  <span className="pred-flag"><TeamFlag iso={match.flag_b} name={match.team_b} size={16} /></span>
                </div>

                <div className="pred-item-status">
                  {!isFinished ? (
                    <span className="pred-pending"><Clock size={14} /> Pendiente</span>
                  ) : isCorrect ? (
                    <span className="pred-correct"><CheckCircle2 size={14} /> +3 pts</span>
                  ) : (
                    <span className="pred-wrong">0 pts</span>
                  )}
                  {isFinished && (
                    <span className="pred-real-score">
                      Real: {match.real_score_a} - {match.real_score_b}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
