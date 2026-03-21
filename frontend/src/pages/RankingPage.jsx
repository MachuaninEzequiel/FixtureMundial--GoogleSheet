import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { rankingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './RankingPage.css';

const MEDAL_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    rankingApi.get()
      .then(({ data }) => setRanking(data))
      .catch(() => setError('No se pudo cargar el ranking.'))
      .finally(() => setLoading(false));
  }, []);

  const podium = ranking.slice(0, 3);

  return (
    <div className="ranking-page page-container page-content">
      <motion.div
        className="ranking-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="ranking-title display">Ranking Global</h1>
        <p className="ranking-subtitle">¿Quién es el mejor pronosticador?</p>
      </motion.div>

      {error && <p style={{ color: 'var(--color-red)', textAlign: 'center' }}>{error}</p>}

      {loading ? (
        <div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: 8 }} />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <div className="ranking-empty">
          <span>🏁</span>
          <p>Todavía no hay usuarios en el ranking. ¡Hacé tu primer pronóstico!</p>
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          {podium.length >= 2 && (
            <div className="ranking-podium">
              {/* Arrange as 2nd, 1st, 3rd */}
              {[podium[1], podium[0], podium[2]].filter(Boolean).map((entry, i) => {
                const positions = [2, 1, 3];
                const pos = positions[i];
                const heights = { 1: 80, 2: 56, 3: 40 };
                return (
                  <motion.div
                    key={entry.id}
                    className={`podium-place podium-${pos}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="podium-medal">{MEDAL_ICONS[pos]}</div>
                    <div className="podium-avatar">{entry.username.charAt(0).toUpperCase()}</div>
                    <div className="podium-username">{entry.username}</div>
                    <div className="podium-points">{entry.total_points} pts</div>
                    <div className="podium-bar" style={{ height: heights[pos] }} />
                    <div className="podium-pos">{pos}</div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="ranking-table-wrap">
            <table className="ranking-table" role="grid" aria-label="Tabla de posiciones">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Pronósticos</th>
                  <th scope="col">Correctos</th>
                  <th scope="col">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, i) => {
                  // Firebase user is identified by email, not numeric id
                  const isMe = user?.email === entry.email;
                  return (
                    <motion.tr
                      key={entry.id}
                      className={`ranking-row ${isMe ? 'ranking-row--me' : ''}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      aria-current={isMe ? 'true' : undefined}
                    >
                      <td className="rank-pos">
                        {MEDAL_ICONS[entry.position] || entry.position}
                      </td>
                      <td className="rank-user">
                        <div className="rank-avatar">{entry.username.charAt(0).toUpperCase()}</div>
                        <span className="rank-username">
                          {entry.username}
                          {isMe && <span className="rank-you-badge">Tú</span>}
                        </span>
                      </td>
                      <td className="rank-num">{entry.total_predictions}</td>
                      <td className="rank-num rank-correct">
                        {entry.correct_predictions}
                        {entry.total_predictions > 0 && (
                          <span className="rank-pct">
                            {' '}({Math.round(entry.correct_predictions / entry.total_predictions * 100)}%)
                          </span>
                        )}
                      </td>
                      <td className="rank-points">{entry.total_points}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
