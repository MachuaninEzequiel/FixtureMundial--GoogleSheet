const { calculatePoints, parseScore, POINTS_EXACT } = require('./scoring');

/**
 * Calcula el ranking completo en código leyendo las hojas `ranking` (registro
 * de usuarios), `predictions` y `matches`.
 *
 * Reemplaza a las fórmulas SUMPRODUCT que vivían en las columnas C/D/E de la
 * hoja `ranking`: estaban rotas porque INDEX+MATCH no se expande como array
 * dentro de SUMPRODUCT en Google Sheets — comparaba todas las predicciones
 * contra el resultado del partido 1.
 *
 * Devuelve la lista ya ordenada, SIN `position`: cada endpoint la asigna
 * después de aplicar sus propios filtros (ej. miembros de una liga privada).
 */
async function computeRanking(sheets) {
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: process.env.SHEET_ID,
    ranges: ['ranking!A2:B', 'predictions!A2:D', 'matches!A2:J'],
  });

  const [userRows, predRows, matchRows] = data.valueRanges.map((r) => r.values || []);

  // match_id → resultado real (scores null si el partido no se jugó)
  const resultById = new Map();
  matchRows.forEach((row) => {
    resultById.set(String(row[0]), {
      real_score_a: parseScore(row[8]),
      real_score_b: parseScore(row[9]),
    });
  });

  // email → (match_id → predicción). Una por usuario×partido; si hubiera
  // filas duplicadas gana la última (la más reciente).
  const predsByUser = new Map();
  predRows.forEach((row) => {
    const email = (row[0] || '').toLowerCase();
    if (!email) return;
    if (!predsByUser.has(email)) predsByUser.set(email, new Map());
    predsByUser.get(email).set(String(row[1]), { score_a: row[2], score_b: row[3] });
  });

  return userRows
    .filter((row) => row[0] && row[1])
    .map((row) => {
      const preds = predsByUser.get(row[0].toLowerCase()) || new Map();
      let total_points = 0;
      let correct_predictions = 0; // solo marcadores exactos

      preds.forEach((pred, matchId) => {
        const pts = calculatePoints(pred, resultById.get(matchId));
        if (pts === null) return; // partido sin jugar o inexistente
        total_points += pts;
        if (pts === POINTS_EXACT) correct_predictions++;
      });

      return {
        email: row[0],
        username: row[1],
        total_points,
        total_predictions: preds.size,
        correct_predictions,
      };
    })
    .sort((a, b) =>
      b.total_points - a.total_points ||
      b.correct_predictions - a.correct_predictions ||
      a.username.localeCompare(b.username)
    );
}

module.exports = { computeRanking };
