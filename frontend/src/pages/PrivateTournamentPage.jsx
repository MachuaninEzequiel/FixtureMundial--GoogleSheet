import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tournamentsApi } from '../services/api';
import { Trophy, Users, Plus, KeyRound, Copy, ChevronLeft, UserPlus, CheckCircle2 } from 'lucide-react';
import './RankingPage.css';
import './PrivateTournamentPage.css';

const MEDAL_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const PrivateTournamentPage = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'join', 'detail'
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [rankingData, setRankingData] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  // Forms states
  const [createData, setCreateData] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [addEmailBuf, setAddEmailBuf] = useState('');
  
  // Feedback states
  const [copiedCode, setCopiedCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' }); // type: 'success' | 'error'

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tournamentsApi.getAll();
      setTournaments(res.data);
    } catch (err) {
      setError('Error al cargar tus torneos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      await tournamentsApi.create(createData);
      setCreateData({ name: '', description: '' });
      await loadTournaments();
      setActiveView('list');
      setActionMessage({ type: 'success', text: 'Torneo creado con éxito.' });
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Error al crear torneo' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      await tournamentsApi.join({ code: joinCode.trim() });
      setJoinCode('');
      await loadTournaments();
      setActiveView('list');
      setActionMessage({ type: 'success', text: 'Te has unido al torneo exitosamente.' });
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Código inválido o ya eres miembro' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMemberByEmail = async (e) => {
    e.preventDefault();
    if (!addEmailBuf) return;
    setActionLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      await tournamentsApi.join({ code: selectedTournament.id, emailToAdd: addEmailBuf.trim() });
      setAddEmailBuf('');
      setActionMessage({ type: 'success', text: 'Usuario agregado correctamente.' });
      // Reload ranking silently to update member count implicitly if needed, but ranking will only show them if they have played inside ranking sheet
      await loadTournamentRanking(selectedTournament);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Error al agregar usuario' });
    } finally {
      setActionLoading(false);
    }
  };

  const openTournament = async (t) => {
    setSelectedTournament(t);
    setActiveView('detail');
    await loadTournamentRanking(t);
  };

  const loadTournamentRanking = async (t) => {
    try {
      setRankingLoading(true);
      const res = await tournamentsApi.getRanking(t.id);
      setRankingData(res.data.ranking);
    } catch (err) {
      console.error(err);
      setActionMessage({ type: 'error', text: 'Error al cargar el ranking de este torneo.' });
    } finally {
      setRankingLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  if (loading) {
    return (
      <div className="page-container tournament-page page-content">
        <div className="tournaments-loader">
          <div className="loader-icon">🏆</div>
          <p>Preparando ligas privadas...</p>
        </div>
      </div>
    );
  }

  // View: Create
  if (activeView === 'create') {
    return (
      <div className="page-container tournament-page page-content">
        <button className="btn-ghost" style={{ border: 'none', marginBottom: '32px', paddingLeft: '0', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '500' }} onClick={() => { setActiveView('list'); setActionMessage({type:'', text:''}); }}>
          <ChevronLeft size={20} /> Volver
        </button>
        <div className="tournament-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="ranking-title display" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', margin: '0 0 12px 0', textAlign: 'center' }}>Crear Nuevo Torneo</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Configura tu liga privada y luego invita a tus amigos o compañeros de trabajo.</p>
          
          <form className="tournament-form" onSubmit={handleCreate}>
            <div className="form-group">
              <label>Nombre del Torneo *</label>
              <input 
                type="text" 
                className="input"
                required 
                placeholder="Ej: Liga de la Oficina" 
                value={createData.name} 
                onChange={e => setCreateData({...createData, name: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Descripción (Opcional)</label>
              <textarea 
                className="input"
                placeholder="Reglas, premios, etc." 
                value={createData.description} 
                onChange={e => setCreateData({...createData, description: e.target.value})} 
                rows={3}
              />
            </div>
            {actionMessage.text && <div className={`message-alert ${actionMessage.type}`}>{actionMessage.text}</div>}
            <button type="submit" className="btn-tourn btn-create" style={{ margin: '12px auto 0', width: '100%', maxWidth: '100%' }} disabled={actionLoading}>
              {actionLoading ? 'Creando...' : 'Crear Torneo'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // View: Join
  if (activeView === 'join') {
    return (
      <div className="page-container tournament-page page-content">
        <button className="btn-ghost" style={{ border: 'none', marginBottom: '32px', paddingLeft: '0', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '500' }} onClick={() => { setActiveView('list'); setActionMessage({type:'', text:''}); }}>
          <ChevronLeft size={20} /> Volver
        </button>
        <div className="tournament-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="ranking-title display" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', margin: '0 0 12px 0', textAlign: 'center' }}>Unirse a Torneo</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>Ingresa el código de 6 caracteres del torneo al que quieres unirte.</p>
          
          <form className="tournament-form" onSubmit={handleJoin}>
            <div className="form-group">
              <label>Código de Invitación</label>
              <input 
                type="text" 
                className="input"
                required 
                placeholder="Ej: A1X9K2" 
                value={joinCode} 
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </div>
            {actionMessage.text && <div className={`message-alert ${actionMessage.type}`}>{actionMessage.text}</div>}
            <button type="submit" className="btn-tourn btn-create" style={{ margin: '12px auto 0', width: '100%', maxWidth: '100%' }} disabled={actionLoading || joinCode.length < 5}>
              {actionLoading ? 'Uniéndose...' : 'Unirme'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // View: Detail (Ranking inside a Tournament)
  if (activeView === 'detail' && selectedTournament) {
    const isOwner = selectedTournament.ownerEmail.toLowerCase() === user.email.toLowerCase();
    
    return (
      <div className="page-container tournament-page page-content">
        <div className="tournament-header-nav">
          <button className="btn-ghost" style={{ border: 'none', marginBottom: '32px', paddingLeft: '0', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: '500' }} onClick={() => {
            setSelectedTournament(null);
            setActiveView('list');
            setRankingData([]);
            setActionMessage({type:'', text:''});
          }}>
            <ChevronLeft size={20} /> Mis Torneos
          </button>
        </div>

        <div className="tournament-detail-header animate-fade-in">
          <div className="td-title">
            <Trophy className="td-icon" size={28} />
            <div>
              <h2>{selectedTournament.name}</h2>
              {selectedTournament.description && <p className="td-desc">{selectedTournament.description}</p>}
            </div>
          </div>
          
          <div className="td-invite-box">
            <span className="td-invite-label">CÓDIGO DE INVITACIÓN</span>
            <div className="td-code-group" onClick={() => handleCopyCode(selectedTournament.id)}>
              <span className="td-code">{selectedTournament.id}</span>
              <button aria-label="Copiar código">
                {copiedCode === selectedTournament.id ? <CheckCircle2 size={18} color="#22c55e" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="tournament-owner-panel animate-fade-in">
            <h3><UserPlus size={18}/> Agregar Participante por Email</h3>
            <p>Como creador, puedes forzar la entrada de usuarios mediante su correo (ideal para compañeros que no saben usar códigos).</p>
            <form className="owner-add-form" onSubmit={handleAddMemberByEmail}>
              <input 
                type="email" 
                className="input"
                placeholder="email@ejemplo.com" 
                value={addEmailBuf} 
                onChange={(e) => setAddEmailBuf(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-tourn btn-create" style={{ minWidth: '160px', padding: '12px 24px' }} disabled={actionLoading}>
                {actionLoading ? 'Agregando...' : 'Agregar'}
              </button>
            </form>
            {actionMessage.text && <div className={`message-alert ${actionMessage.type}`} style={{marginTop: '12px'}}>{actionMessage.text}</div>}
          </div>
        )}

        <div className="ranking-container tournament-ranking animate-fade-in" style={{ marginTop: '56px' }}>
          <div className="ranking-header" style={{ marginBottom: '32px' }}>
            <h2 className="ranking-title display" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', margin: '0 0 8px 0', textAlign: 'left' }}>Ranking Privado</h2>
            <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', display: 'block' }}>
              {selectedTournament.members.length} {selectedTournament.members.length === 1 ? 'participante compitiendo' : 'participantes compitiendo'}
            </span>
          </div>

          {rankingLoading ? (
            <div className="tournaments-loader" style={{ minHeight: '30vh' }}>
              <div className="loader-icon">📈</div>
              <p>Calculando posiciones...</p>
            </div>
          ) : (
            <div className="ranking-table-wrap">
              <table className="ranking-table" role="grid" aria-label="Tabla de posiciones privada">
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
                  {rankingData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="ranking-empty" style={{padding: '40px'}}>Aún no hay puntuaciones en este torneo.</td>
                    </tr>
                  ) : (
                    rankingData.map((row) => {
                      const isMe = row.email?.toLowerCase() === user.email?.toLowerCase();
                      const isOwner = row.email?.toLowerCase() === selectedTournament.ownerEmail.toLowerCase();
                      return (
                        <tr key={row.email} className={`ranking-row ${isMe ? 'ranking-row--me' : ''}`} aria-current={isMe ? 'true' : undefined}>
                          <td className="rank-pos">
                            {MEDAL_ICONS[row.position] || row.position}
                          </td>
                          <td className="rank-user">
                            <div className="rank-avatar">{row.username ? row.username.charAt(0).toUpperCase() : '?'}</div>
                            <span className="rank-username">
                              {row.username || row.email}
                              {isMe && <span className="rank-you-badge">Tú</span>}
                              {isOwner && <span className="owner-badge">Admin</span>}
                            </span>
                          </td>
                          <td className="rank-num">{row.total_predictions}</td>
                          <td className="rank-num rank-correct">
                            {row.correct_predictions}
                            {row.total_predictions > 0 && (
                              <span className="rank-pct">
                                {' '}({Math.round(row.correct_predictions / row.total_predictions * 100)}%)
                              </span>
                            )}
                          </td>
                          <td className="rank-points">{row.total_points}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View: List (Default)
  return (
    <div className="page-container tournament-page page-content">
      <div className="ranking-hero animate-fade-in" style={{marginBottom: '40px'}}>
        <h1 className="ranking-title display">Ligas Privadas</h1>
        <p className="ranking-subtitle">Compite exclusivamente contra tus amigos o compañeros.</p>
      </div>

      {actionMessage.text && <div className={`message-alert ${actionMessage.type}`}>{actionMessage.text}</div>}

      <div className="tournaments-actions animate-fade-in">
        <button className="btn-tourn btn-create" onClick={() => setActiveView('create')}>
          <Plus size={18} /> Crear Torneo
        </button>
        <button className="btn-tourn btn-join" onClick={() => setActiveView('join')}>
          <KeyRound size={18} /> Unirse con Código
        </button>
      </div>

      <div className="tournaments-list animate-fade-in" style={{animationDelay: '0.1s'}}>
        {error ? (
          <div className="error-message">{error}</div>
        ) : tournaments.length === 0 ? (
          <div className="ranking-empty">
            <span style={{ fontSize: '3.5rem', marginBottom: '16px', display: 'block' }}>🏆</span>
            <p style={{fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text)'}}>No perteneces a ninguna liga privada.</p>
            <p>Crea tu propia liga o únete a la de tus amigos usando un código de invitación.</p>
          </div>
        ) : (
          <div className="tournaments-grid">
            {tournaments.map(t => (
              <div key={t.id} className="tournament-card interactive" onClick={() => openTournament(t)}>
                <div className="card-header">
                  <h3>{t.name}</h3>
                  <span className="member-count"><Users size={14}/> {t.members.length}</span>
                </div>
                {t.description && <p className="card-desc">{t.description}</p>}
                
                <div className="card-footer">
                  <span className="role-badge">
                    {t.ownerEmail.toLowerCase() === user.email.toLowerCase() ? 'Creador' : 'Participante'}
                  </span>
                  <span className="view-link">Ver Ranking →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateTournamentPage;
