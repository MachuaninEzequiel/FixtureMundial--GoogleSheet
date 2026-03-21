import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, CheckCircle2, XCircle, Clock,
  Trash2, RefreshCw, Search, RotateCcw, Trophy, Save
} from 'lucide-react';
import { TeamFlag } from '../utils/flags.jsx';
import api from '../services/api';
import './AdminPage.css';

const STATUS_CONFIG = {
  pending:  { label: 'Pendiente',  icon: <Clock size={13} />,        cls: 'status-pending'  },
  approved: { label: 'Aprobado',   icon: <CheckCircle2 size={13} />, cls: 'status-approved' },
  rejected: { label: 'Rechazado', icon: <XCircle size={13} />,      cls: 'status-rejected' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`admin-status-badge ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'matches'
  
  // Users State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch {
      setError('No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Matches State
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchScores, setMatchScores] = useState({});
  const [savingMatch, setSavingMatch] = useState(null);

  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true);
    try {
      const { data } = await api.get('/matches');
      setMatches(data);
      // Pre-fill existing results
      const initialScores = {};
      data.forEach(m => {
        if (m.real_score_a !== null && m.real_score_b !== null) {
          initialScores[m.id] = { a: m.real_score_a, b: m.real_score_b };
        }
      });
      setMatchScores(initialScores);
    } catch {
      setError('No se pudo cargar la lista de partidos.');
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => { 
    if (activeTab === 'users') fetchUsers(); 
    else fetchMatches();
  }, [activeTab, fetchUsers, fetchMatches]);

  const doAction = async (userId, action) => {
    setActionLoading(p => ({ ...p, [userId]: action }));
    try {
      await api.patch(`/admin/users/${userId}/${action}`);
      setUsers(prev => prev.map(u =>
        u.id === userId
          ? { ...u, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending' }
          : u
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al realizar la acción');
    } finally {
      setActionLoading(p => ({ ...p, [userId]: null }));
    }
  };

  const doDelete = async (user) => {
    if (!window.confirm(`¿Eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`)) return;
    setActionLoading(p => ({ ...p, [user.id]: 'delete' }));
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setActionLoading(p => ({ ...p, [user.id]: null }));
    }
  };

  const saveMatchResult = async (matchId) => {
    const scores = matchScores[matchId];
    if (!scores || scores.a === undefined || scores.b === undefined || scores.a === '' || scores.b === '') {
      return alert('Debes completar ambos resultados.');
    }
    
    setSavingMatch(matchId);
    try {
      const { data } = await api.patch(`/admin/matches/${matchId}/result`, {
        score_a: parseInt(scores.a, 10),
        score_b: parseInt(scores.b, 10)
      });
      alert(data.message || 'Resultado guardado correctamente.');
      // Refresh local data state
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, real_score_a: scores.a, real_score_b: scores.b, status: 'finished' } : m));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar el resultado.');
    } finally {
      setSavingMatch(null);
    }
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;

  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="admin-page page-container page-content">
      {/* Hero */}
      <motion.div
        className="admin-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="admin-badge">
          <ShieldCheck size={16} /> Panel de Administrador
        </div>
        <h1 className="admin-title display">Gestión del Torneo</h1>
        
        <div className="admin-tabs">
           <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
             <Users size={18} /> Usuarios
           </button>
           <button className={`admin-tab-btn ${activeTab === 'matches' ? 'active' : ''}`} onClick={() => setActiveTab('matches')}>
             <Trophy size={18} /> Partidos (Resultados)
           </button>
        </div>

        {activeTab === 'users' && pendingCount > 0 && (
          <motion.div
            className="admin-pending-alert"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Clock size={16} />
            <strong>{pendingCount} usuario{pendingCount > 1 ? 's' : ''}</strong> esperando aprobación
          </motion.div>
        )}
      </motion.div>

      {error && <p style={{ color: 'var(--color-red)', textAlign: 'center', marginBottom: 20 }}>{error}</p>}

      {activeTab === 'users' ? (
        <>
          {/* Stats */}
          <div className="admin-stats">
        {[
          { label: 'Total',     value: users.length,                                  cls: '' },
          { label: 'Pendientes', value: users.filter(u => u.status === 'pending').length,  cls: 'stat-warn' },
          { label: 'Aprobados', value: users.filter(u => u.status === 'approved').length, cls: 'stat-ok'   },
          { label: 'Rechazados', value: users.filter(u => u.status === 'rejected').length, cls: 'stat-err'  },
        ].map(s => (
          <div key={s.label} className={`admin-stat ${s.cls}`}>
            <span className="admin-stat-val">{s.value}</span>
            <span className="admin-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-controls">
        <div className="admin-search-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search"
            type="text"
            placeholder="Buscar por usuario o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-tabs" role="group">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              className={`admin-filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : STATUS_CONFIG[f]?.label}
              {f !== 'all' && (
                <span className="filter-count">
                  {users.filter(u => u.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <button className="btn btn-ghost btn-sm" onClick={fetchUsers} title="Actualizar">
          <RefreshCw size={15} />
        </button>
      </div>

      {error && <p style={{ color: 'var(--color-red)', textAlign: 'center' }}>{error}</p>}

      {/* Table */}
      {loading ? (
        <div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: 8 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <Users size={40} />
          <p>No hay usuarios que coincidan con el filtro.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table" role="grid">
            <thead>
              <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Pred.</th>
                <th>Pts.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((u, i) => {
                  const isLoading = actionLoading[u.id];
                  const regDate = u.created_at
                    ? new Date(u.created_at * 1000).toLocaleDateString('es-AR')
                    : '-';
                  return (
                    <motion.tr
                      key={u.id}
                      className={`admin-row admin-row--${u.status} ${u.is_admin ? 'admin-row--admin' : ''}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <td className="admin-td-id">{u.id}</td>
                      <td className="admin-td-user">
                        <div className="admin-user-cell">
                          <div className="admin-avatar">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="admin-username">
                              {u.username}
                              {u.is_admin && <span className="admin-crown">👑</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-td-email">{u.email}</td>
                      <td><StatusBadge status={u.status} /></td>
                      <td className="admin-td-date">{regDate}</td>
                      <td className="admin-td-num">{u.total_predictions}</td>
                      <td className="admin-td-pts">{u.total_points}</td>
                      <td className="admin-td-actions">
                        {!u.is_admin && (
                          <div className="admin-actions">
                            {u.status !== 'approved' && (
                              <button
                                className="admin-action-btn admin-action-approve"
                                onClick={() => doAction(u.id, 'approve')}
                                disabled={!!isLoading}
                                title="Aprobar"
                              >
                                {isLoading === 'approve' ? <RefreshCw size={13} className="spin" /> : <CheckCircle2 size={14} />}
                                Aprobar
                              </button>
                            )}
                            {u.status !== 'rejected' && (
                              <button
                                className="admin-action-btn admin-action-reject"
                                onClick={() => doAction(u.id, 'reject')}
                                disabled={!!isLoading}
                                title="Rechazar"
                              >
                                {isLoading === 'reject' ? <RefreshCw size={13} className="spin" /> : <XCircle size={14} />}
                                Rechazar
                              </button>
                            )}
                            {u.status === 'approved' && (
                              <button
                                className="admin-action-btn admin-action-pending"
                                onClick={() => doAction(u.id, 'pending')}
                                disabled={!!isLoading}
                                title="Volver a pendiente"
                              >
                                <RotateCcw size={13} />
                              </button>
                            )}
                            <button
                              className="admin-action-btn admin-action-delete"
                              onClick={() => doDelete(u)}
                              disabled={!!isLoading}
                              title="Eliminar usuario"
                            >
                              {isLoading === 'delete' ? <RefreshCw size={13} className="spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        )}
                        {u.is_admin && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Administrador</span>}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
      </>
      ) : ( // MACHES TAB
        <div className="admin-matches-tab">
           {matchesLoading ? (
            <div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />
              ))}
            </div>
           ) : (
             <div className="admin-matches-list">
               <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={fetchMatches} title="Actualizar Partidos">
                    <RefreshCw size={15} /> Recargar
                  </button>
               </div>
               
               {matches.map(m => {
                 const isSaving = savingMatch === m.id;
                 const isFinished = m.status === 'finished' || (m.real_score_a !== null);
                 const scores = matchScores[m.id] || { a: '', b: '' };

                 // Group label mapping
                 let roundLabel = m.phase;
                 if (m.phase === 'groups') roundLabel = `Grupo ${m.group_name}`;
                 else if (m.phase === 'round_of_32') roundLabel = '16avos de Final';
                 else if (m.phase === 'round_of_16') roundLabel = 'Octavos de Final';
                 else if (m.phase === 'quarterfinals') roundLabel = 'Cuartos de Final';
                 else if (m.phase === 'semifinals') roundLabel = 'Semifinales';
                 else if (m.phase === 'third_place') roundLabel = 'Tercer Puesto';
                 else if (m.phase === 'final') roundLabel = 'Final';
                 
                 return (
                   <div key={m.id} className={`admin-match-row ${isFinished ? 'admin-match-finished' : ''}`}>
                      <div className="am-info">
                        <span className="am-phase">{roundLabel}</span>
                        <span className="am-date">{new Date(m.match_date * 1000).toLocaleString('es-AR')}</span>
                      </div>
                      
                      <div className="am-teams-inputs">
                        <div className="am-team am-team-a">
                           <TeamFlag iso={m.flag_a} name={m.team_a} size={24} />
                           <span className="am-team-name">{m.team_a}</span>
                        </div>
                        
                        <div className="am-inputs">
                           <input 
                              type="number" 
                              min="0"
                              className="input am-score-input"
                              value={scores.a} 
                              onChange={(e) => setMatchScores(p => ({ ...p, [m.id]: { ...p[m.id], a: e.target.value } }))} 
                           />
                           <span>-</span>
                           <input 
                              type="number" 
                              min="0"
                              className="input am-score-input"
                              value={scores.b} 
                              onChange={(e) => setMatchScores(p => ({ ...p, [m.id]: { ...p[m.id], b: e.target.value } }))} 
                           />
                        </div>

                        <div className="am-team am-team-b">
                           <span className="am-team-name">{m.team_b}</span>
                           <TeamFlag iso={m.flag_b} name={m.team_b} size={24} />
                        </div>
                      </div>

                      <div className="am-actions">
                         <button 
                           className="btn btn-primary btn-sm" 
                           onClick={() => saveMatchResult(m.id)}
                           disabled={isSaving}
                         >
                           {isSaving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
                           {isFinished ? 'Modificar' : 'Guardar'}
                         </button>
                      </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
