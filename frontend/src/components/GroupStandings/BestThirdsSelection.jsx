import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { AlertCircle, GripVertical, Check } from 'lucide-react';
import { TeamFlag } from '../../utils/flags.jsx';
import './GroupStandings.css'; // Reuse table styles

export function BestThirdsSelection({ allThirds, thirdsTied, tiedThirdTeams, tiebreakers, onResolveTie }) {
  const [localTieOrder, setLocalTieOrder] = useState(tiedThirdTeams || []);

  const handleReorder = (newOrder) => {
    setLocalTieOrder(newOrder);
  };

  const handleSaveTiebreaker = () => {
    onResolveTie('thirds', localTieOrder);
  };

  return (
    <div className="sim-bracket-wrapper" style={{ marginTop: 32 }}>
      <h2 className="sim-bracket-title">Clasificación a 8vos (Mejores Terceros)</h2>
      
      <div className="standings-wrapper" style={{ marginBottom: 20 }}>
        <table className="standings-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th className="th-team">Selección</th>
              <th>Grupo</th>
              <th>Pts</th>
              <th>DIF</th>
              <th>GF</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allThirds.map((t, idx) => {
              const qualifies = idx < 8;
              const isTied = tiedThirdTeams?.includes(t.team);
              return (
                <tr key={t.team} className={`${qualifies ? 'row-advancing' : ''} ${isTied && thirdsTied ? 'row-third' : ''}`}>
                  <td className="st-pos">{idx + 1}</td>
                  <td className="st-team">
                    <TeamFlag iso={t.flag} name={t.team} size={16} />
                    <span className="st-team-name">{t.team}</span>
                  </td>
                  <td>{t.sourceGroup}</td>
                  <td className="st-pts"><strong>{t.pts}</strong></td>
                  <td>{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                  <td>{t.gf}</td>
                  <td style={{ fontSize: '0.75rem', fontWeight: 600, color: qualifies ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {qualifies ? 'Clasificado' : 'Eliminado'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {thirdsTied && tiedThirdTeams && tiedThirdTeams.length > 1 && (
          <div className="tiebreaker-alert">
            <div className="tiebreaker-header">
              <AlertCircle size={16} />
              <span>Hay un empate exacto en la zona de clasificación. Arrastrá para definir quiénes pasan:</span>
            </div>
            <Reorder.Group axis="y" values={localTieOrder} onReorder={handleReorder} className="tiebreaker-list">
              {localTieOrder.map((teamName) => {
                 const t = allThirds.find(x => x.team === teamName);
                 return (
                   <Reorder.Item key={teamName} value={teamName} className="tiebreaker-item">
                     <GripVertical size={14} className="drag-handle" />
                     <TeamFlag iso={t?.flag} name={t?.team} size={16} />
                     <span>{teamName} (Grupo {t?.sourceGroup})</span>
                   </Reorder.Item>
                 )
              })}
            </Reorder.Group>
            <button className="btn btn-primary btn-sm btn-tie-save" onClick={handleSaveTiebreaker}>
              <Check size={14}/> Confirmar Clasificados
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
