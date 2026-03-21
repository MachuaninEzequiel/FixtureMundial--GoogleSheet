import { motion } from 'framer-motion';
import { TeamFlag } from '../../utils/flags.jsx';
import './BracketView.css';

const LOCKOUT_BUFFER = 5 * 60;

// Phase display names for knockout header
const ROUND_CONFIG = [
  { key: 'round_of_32',   label: '16avos',   short: 'R32' },
  { key: 'round_of_16',   label: 'Octavos',  short: 'R16' },
  { key: 'quarterfinals', label: 'Cuartos',   short: 'QF'  },
  { key: 'semifinals',    label: 'Semis',      short: 'SF'  },
  { key: 'final',         label: 'Final',      short: 'F'   },
];

// ─── MATCH SLOT (knockout bracket) ───────────────────────────────────────────
function BracketSlot({ match, onOpenModal, side = 'left', simResult, onSimChange, isSimMode, showName = true }) {
  if (!match) return <div className="bracket-slot bracket-slot--empty" />;

  const pred = match.userPrediction;
  const now = Math.floor(Date.now() / 1000);
  const isLocked = match.match_date && now >= match.match_date - LOCKOUT_BUFFER;
  const hasResult = match.real_score_a !== null && match.real_score_a !== undefined;

  const getResult = (scoreA, scoreB) => {
    if (scoreA > scoreB) return 'a';
    if (scoreB > scoreA) return 'b';
    return 'draw';
  };

  const realResult = hasResult ? getResult(match.real_score_a, match.real_score_b) : null;
  const predResult = pred ? getResult(pred.score_a, pred.score_b) : null;

  const isWinnerA = isSimMode && simResult
    ? simResult.score_a > simResult.score_b
    : realResult === 'a' || predResult === 'a';

  const isWinnerB = isSimMode && simResult
    ? simResult.score_b > simResult.score_a
    : realResult === 'b' || predResult === 'b';

  const simA = simResult?.score_a ?? '';
  const simB = simResult?.score_b ?? '';

  return (
    <motion.button
      className={`bracket-slot ${pred || simResult ? 'bracket-slot--predicted' : ''} ${hasResult ? 'bracket-slot--finished' : ''}`}
      onClick={() => {
        if (isSimMode && (!match.team_a || match.team_a.includes('Ganador') || match.team_a.includes('1º') || match.team_b.includes('Ganador') || match.team_b.includes('1º'))) return;
        onOpenModal(match);
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={`${match.team_a} vs ${match.team_b}`}
      style={isSimMode && (!match.team_a || match.team_a.includes('Ganador') || match.team_a.includes('1º')) ? { cursor: 'default' } : {}}
    >
      {/* Team A */}
      <div className={`b-team b-team-a ${isWinnerA && (hasResult || pred || simResult) ? 'b-team--winner' : ''}`}>
        <TeamFlag iso={match.flag_a} name={match.team_a} size={showName ? 18 : 24} />
        {showName ? (
          <span className="b-team-name">{match.team_a}</span>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        {isSimMode ? (
          <span className="b-team-score">
            {simA !== '' ? simA : '?'}
          </span>
        ) : (
          <span className="b-team-score">
            {hasResult ? match.real_score_a : pred ? pred.score_a : '?'}
          </span>
        )}
      </div>

      {/* Team B */}
      <div className={`b-team b-team-b ${isWinnerB && (hasResult || pred || simResult) ? 'b-team--winner' : ''}`}>
        <TeamFlag iso={match.flag_b} name={match.team_b} size={showName ? 18 : 24} />
        {showName ? (
          <span className="b-team-name">{match.team_b}</span>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        {isSimMode ? (
          <span className="b-team-score">
            {simB !== '' ? simB : '?'}
          </span>
        ) : (
          <span className="b-team-score">
            {hasResult ? match.real_score_b : pred ? pred.score_b : '?'}
          </span>
        )}
      </div>

      {isLocked && !hasResult && (
        <div className="b-locked">🔒</div>
      )}
    </motion.button>
  );
}

// ─── KNOCKOUT BRACKET ────────────────────────────────────────────────────────
function KnockoutBracket({ matchesByPhase, onOpenModal, isSimMode, simResults, onSimChange }) {
  // We only care about rounds before the final for the wings
  const wingRounds = ROUND_CONFIG.filter(r => r.key !== 'final' && r.key !== 'third_place' && (matchesByPhase[r.key] || []).length > 0);
  
  const finalMatches = matchesByPhase['final'] || [];
  const thirdPlaceMatches = matchesByPhase['third_place'] || [];

  const splitMatches = (matches) => {
    if (!matches || matches.length === 0) return { left: [], right: [] };
    const half = Math.ceil(matches.length / 2);
    // The second half elements usually pair off inversely or directly in the FIFA bracket depending on exact matrix, 
    // but a clean halfway slice renders perfectly symmetrically.
    return {
      left: matches.slice(0, half),
      right: matches.slice(half)
    };
  };

  const SLOT_HEIGHT = 64;
  const SLOT_MARGIN = 32;
  const LEVEL_SEP = SLOT_HEIGHT + SLOT_MARGIN; // S = 96

  const renderWing = (side) => {
    return (
      <div className={`bracket-half ${side}`}>
        <div className="bracket-headers">
          {wingRounds.map((r, colIdx) => (
            <div key={r.key} className={`bracket-round-header ${colIdx === 0 ? 'bracket-col--wide' : 'bracket-col--compact'}`}>{r.label}</div>
          ))}
        </div>
        <div className="bracket-columns">
          {wingRounds.map((round, colIdx) => {
            const phaseMatches = matchesByPhase[round.key] || [];
            const { left, right } = splitMatches(phaseMatches);
            const matches = side === 'left' ? left : right;
            const d = colIdx;

            return (
              <div key={round.key} className={`bracket-col bracket-col-${colIdx} ${colIdx === 0 ? 'bracket-col--wide' : 'bracket-col--compact'}`}>
                {matches.map((match, i) => {
                  const isFirstInCol = i === 0;
                  const isTopChild = i % 2 === 0;

                  // Perfect Geometric Progression
                  const marginTop = isFirstInCol && d > 0 ? (Math.pow(2, d - 1) - 0.5) * LEVEL_SEP : 0;
                  const marginBottom = (Math.pow(2, d) * LEVEL_SEP) - SLOT_HEIGHT;
                  
                  const connectorHeight = 0.5 * Math.pow(2, d) * LEVEL_SEP;

                  return (
                    <div
                      key={match.id}
                      className="bracket-cell"
                      style={{
                        marginTop: `${marginTop}px`,
                        marginBottom: `${marginBottom}px`,
                      }}
                    >
                      <BracketSlot 
                        match={match} 
                        onOpenModal={onOpenModal} 
                        side={side}
                        isSimMode={isSimMode}
                        simResult={simResults ? simResults[match.id] : null}
                        onSimChange={onSimChange}
                        showName={colIdx === 0}
                      />
                      {d < wingRounds.length - 1 && (
                        <div 
                          className={`bracket-connector ${side} ${isTopChild ? 'top-child' : 'bottom-child'}`}
                          style={{ height: `${connectorHeight}px` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="knockout-bracket">
      {/* Left Wing */}
      {renderWing('left')}

      {/* Center (Final & Third Place) */}
      <div className="bracket-center">
        {finalMatches.length > 0 && (
          <div className="bracket-center-final">
            <div className="bracket-center-title">🏆 Final</div>
            <BracketSlot 
              match={finalMatches[0]} 
              onOpenModal={onOpenModal} 
              isSimMode={isSimMode}
              simResult={simResults ? simResults[finalMatches[0].id] : null}
              onSimChange={onSimChange}
              showName={false}
            />
          </div>
        )}
        
        {thirdPlaceMatches.length > 0 && (
          <div className="bracket-center-third">
            <div className="bracket-center-title" style={{ color: 'var(--color-text-muted)' }}>🥉 3º Puesto</div>
            <BracketSlot 
              match={thirdPlaceMatches[0]} 
              onOpenModal={onOpenModal} 
              isSimMode={isSimMode}
              simResult={simResults ? simResults[thirdPlaceMatches[0].id] : null}
              onSimChange={onSimChange}
              showName={false}
            />
          </div>
        )}
      </div>

      {/* Right Wing */}
      {renderWing('right')}
    </div>
  );
}

// ─── GROUPS GRID ──────────────────────────────────────────────────────────────
function GroupCard({ groupName, matches, onOpenModal }) {
  return (
    <div className="bg-group-card">
      <div className="bg-group-header">Grupo {groupName}</div>
      <div className="bg-group-matches">
        {matches.map(match => {
          const pred = match.userPrediction;
          const hasResult = match.real_score_a !== null && match.real_score_a !== undefined;
          const now = Math.floor(Date.now() / 1000);
          const isLocked = match.match_date && now >= match.match_date - LOCKOUT_BUFFER;

          return (
            <button
              key={match.id}
              className={`bg-match ${pred ? 'bg-match--predicted' : ''} ${hasResult ? 'bg-match--finished' : ''}`}
              onClick={() => onOpenModal(match)}
              aria-label={`${match.team_a} vs ${match.team_b}`}
            >
              <div className="bg-team bg-team-a">
                <TeamFlag iso={match.flag_a} name={match.team_a} size={16} />
                <span className="bg-team-name">{match.team_a}</span>
              </div>
              <div className="bg-score">
                {hasResult
                  ? <span className="bg-real">{match.real_score_a}-{match.real_score_b}</span>
                  : pred
                  ? <span className="bg-pred">{pred.score_a}-{pred.score_b}</span>
                  : <span className="bg-placeholder">?-?</span>
                }
              </div>
              <div className="bg-team bg-team-b">
                <span className="bg-team-name">{match.team_b}</span>
                <TeamFlag iso={match.flag_b} name={match.team_b} size={16} />
              </div>
              {isLocked && !hasResult && <span className="bg-lock">🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GroupsGrid({ matches, onOpenModal }) {
  const byGroup = matches.reduce((acc, m) => {
    const g = m.group_name || '?';
    if (!acc[g]) acc[g] = [];
    acc[g].push(m);
    return acc;
  }, {});

  return (
    <div className="bracket-groups-grid">
      {Object.entries(byGroup).sort(([a], [b]) => a.localeCompare(b)).map(([g, gMatches]) => (
        <motion.div
          key={g}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Object.keys(byGroup).sort().indexOf(g) * 0.04 }}
        >
          <GroupCard groupName={g} matches={gMatches} onOpenModal={onOpenModal} />
        </motion.div>
      ))}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function BracketView({ matchesByPhase, onOpenModal, isSimMode, simResults, onSimChange }) {
  const groupMatches = matchesByPhase['groups'] || [];

  return (
    <div className="bracket-view">
      {/* Groups */}
      {!isSimMode && (
        <div className="bracket-section">
          <h2 className="bracket-section-title">
            <span className="bracket-section-icon">⚽</span> Fase de Grupos
          </h2>
          <GroupsGrid matches={groupMatches} onOpenModal={onOpenModal} />
        </div>
      )}

      {/* Knockout */}
      <div className="bracket-section">
        <h2 className="bracket-section-title">
          <span className="bracket-section-icon">🏆</span> Fase Eliminatoria
        </h2>
        <div className="bracket-knockout-scroll">
          <KnockoutBracket 
            matchesByPhase={matchesByPhase} 
            onOpenModal={onOpenModal} 
            isSimMode={isSimMode} 
            simResults={simResults} 
            onSimChange={onSimChange} 
          />
        </div>
      </div>
    </div>
  );
}
