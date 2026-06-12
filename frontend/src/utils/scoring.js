// Sistema de puntos — Opción B
//   5 pts  marcador exacto
//   4 pts  ganador + diferencia de goles
//   2 pts  solo ganador (o empate)
//   0 pts  no le pegó a nada
//
// Mantener sincronizado con el espejo backend api/_lib/scoring.js
// (los totales del ranking se calculan ahí, en api/_lib/ranking.js).

export const POINTS_EXACT = 5;
export const POINTS_DIFF = 4;
export const POINTS_WINNER = 2;
export const POINTS_NONE = 0;

export function calculatePoints(pred, match) {
  if (!pred || !match) return null;
  if (match.real_score_a === null || match.real_score_a === undefined) return null;
  if (match.real_score_b === null || match.real_score_b === undefined) return null;

  const pa = Number(pred.score_a);
  const pb = Number(pred.score_b);
  const ra = Number(match.real_score_a);
  const rb = Number(match.real_score_b);

  if (pa === ra && pb === rb) return POINTS_EXACT;
  if (pa - pb === ra - rb) return POINTS_DIFF;
  if (Math.sign(pa - pb) === Math.sign(ra - rb)) return POINTS_WINNER;
  return POINTS_NONE;
}

export function pointsBadge(points) {
  if (points === null || points === undefined) return null;
  if (points === POINTS_EXACT) return { label: `+${points} pts`, cls: 'badge-green', tag: 'Exacto' };
  if (points === POINTS_DIFF)  return { label: `+${points} pts`, cls: 'badge-green', tag: 'Diferencia' };
  if (points === POINTS_WINNER) return { label: `+${points} pts`, cls: 'badge-blue',  tag: 'Ganador' };
  return { label: '0 pts', cls: 'badge-red', tag: 'Sin puntos' };
}

export const SCORING_LEGEND = [
  { points: POINTS_EXACT,  label: 'Marcador exacto',              example: 'pron 2-1 / real 2-1' },
  { points: POINTS_DIFF,   label: 'Ganador + diferencia exacta', example: 'pron 3-1 / real 2-0' },
  { points: POINTS_WINNER, label: 'Solo ganador (o empate)',     example: 'pron 4-1 / real 2-0' },
  { points: POINTS_NONE,   label: 'No le pegaste a nada',         example: 'pron 1-2 / real 2-0' },
];
