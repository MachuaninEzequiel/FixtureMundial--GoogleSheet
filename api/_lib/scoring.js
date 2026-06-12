// Sistema de puntos — Opción B (espejo CommonJS de frontend/src/utils/scoring.js).
//   5 pts  marcador exacto
//   4 pts  ganador + diferencia de goles
//   2 pts  solo ganador (o empate)
//   0 pts  no le pegó a nada
// Si se cambia la escala, actualizar AMBOS archivos.

const POINTS_EXACT = 5;
const POINTS_DIFF = 4;
const POINTS_WINNER = 2;
const POINTS_NONE = 0;

// Convierte una celda de resultado del Sheet a número o null.
// La hoja `matches` guarda el texto literal "null" en partidos sin jugar.
function parseScore(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function calculatePoints(pred, match) {
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

module.exports = {
  POINTS_EXACT,
  POINTS_DIFF,
  POINTS_WINNER,
  POINTS_NONE,
  parseScore,
  calculatePoints,
};
