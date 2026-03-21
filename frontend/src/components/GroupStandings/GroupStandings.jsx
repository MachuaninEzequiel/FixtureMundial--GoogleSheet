import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { AlertCircle, GripVertical, Check } from 'lucide-react';
import { TeamFlag } from '../../utils/flags.jsx';
import './GroupStandings.css';

export function GroupStandings({ groupName, teams, tiedTeams, onResolveTie }) {
  // tiedTeams is an array of team names that are tied
  const [localTieOrder, setLocalTieOrder] = useState(tiedTeams || []);

  const handleReorder = (newOrder) => {
    setLocalTieOrder(newOrder);
  };

  const handleSaveTiebreaker = () => {
    onResolveTie(groupName, localTieOrder);
  };

  return (
    <div className="standings-wrapper">
      <table className="standings-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th className="th-team">Selección</th>
            <th>Pts</th>
            <th>PJ</th>
            <th>GF</th>
            <th>GC</th>
            <th>DIF</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, idx) => {
            const isTop2 = idx < 2;
            const isThird = idx === 2;
            return (
              <tr key={t.team} className={`${isTop2 ? 'row-advancing' : ''} ${isThird ? 'row-third' : ''}`}>
                <td className="st-pos">{idx + 1}</td>
                <td className="st-team">
                  <TeamFlag iso={t.flag} name={t.team} size={16} />
                  <span className="st-team-name">{t.team}</span>
                </td>
                <td className="st-pts"><strong>{t.pts}</strong></td>
                <td>{t.played}</td>
                <td>{t.gf}</td>
                <td>{t.gc}</td>
                <td>{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {tiedTeams && tiedTeams.length > 1 && (
        <div className="tiebreaker-alert">
          <div className="tiebreaker-header">
            <AlertCircle size={16} />
            <span>Empate detectado. Arrastrá para definir el orden:</span>
          </div>
          <Reorder.Group axis="y" values={localTieOrder} onReorder={handleReorder} className="tiebreaker-list">
            {localTieOrder.map((teamName) => {
               const t = teams.find(x => x.team === teamName);
               return (
                 <Reorder.Item key={teamName} value={teamName} className="tiebreaker-item">
                   <GripVertical size={14} className="drag-handle" />
                   <TeamFlag iso={t?.flag} name={t?.team} size={16} />
                   <span>{teamName}</span>
                 </Reorder.Item>
               )
            })}
          </Reorder.Group>
          <button className="btn btn-primary btn-sm btn-tie-save" onClick={handleSaveTiebreaker}>
            <Check size={14}/> Confirmar Orden
          </button>
        </div>
      )}
    </div>
  );
}
