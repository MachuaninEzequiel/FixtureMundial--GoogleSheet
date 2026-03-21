const { getSheetsClient } = require('./_lib/sheets');
const { verifyToken } = require('./_lib/auth');

const LOCKOUT_BUFFER = 5 * 60; // 5 minutes in seconds

/**
 * GET  /api/predictions  — Returns all predictions for the authenticated user
 * POST /api/predictions  — Creates or updates a prediction for a match
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth check for all methods
  let decodedToken;
  try {
    decodedToken = await verifyToken(req);
  } catch {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const email = decodedToken.email;
  const sheets = getSheetsClient();

  // ── GET: return all predictions for this user ──────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'predictions!A2:E',
      });

      const userPredictions = (data.values || [])
        .filter((row) => row[0] === email)
        .map((row) => ({
          email: row[0],
          match_id: Number(row[1]),
          score_a: Number(row[2]),
          score_b: Number(row[3]),
          timestamp: row[4] || '',
        }));

      return res.json(userPredictions);
    } catch (err) {
      console.error('[api/predictions GET] ERROR:', err);
      return res.status(500).json({ error: 'Error al obtener pronósticos: ' + err.message });
    }
  }

  // ── POST: save or update a prediction ─────────────────────────────────────
  if (req.method === 'POST') {
    const { match_id, score_a, score_b } = req.body;

    // Validations
    if (match_id === undefined || score_a === undefined || score_b === undefined) {
      return res.status(400).json({ error: 'match_id, score_a y score_b son requeridos' });
    }
    if (!Number.isInteger(score_a) || !Number.isInteger(score_b) || score_a < 0 || score_b < 0) {
      return res.status(400).json({ error: 'Los marcadores deben ser enteros no negativos' });
    }

    try {
      // Read matches to validate match_id and check lockout
      const { data: matchData } = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'matches!A2:K',
      });

      const matchRow = (matchData.values || []).find((row) => Number(row[0]) === match_id);
      if (!matchRow) return res.status(404).json({ error: 'Partido no encontrado' });

      const matchDate = matchRow[7] ? Number(matchRow[7]) : null;
      const now = Math.floor(Date.now() / 1000);
      if (matchDate && now >= matchDate - LOCKOUT_BUFFER) {
        return res.status(403).json({
          error: 'Las predicciones para este partido están cerradas (cierre 5 min antes del inicio).',
        });
      }

      // Read existing predictions to find if this user × match already exists
      const { data: predData } = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'predictions!A2:E',
      });

      const rows = predData.values || [];
      const rowIndex = rows.findIndex(
        (row) => row[0] === email && Number(row[1]) === match_id
      );

      if (rowIndex >= 0) {
        // Update existing row (add 2: 1 for 0-index, 1 for header row)
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: `predictions!C${rowIndex + 2}:E${rowIndex + 2}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[score_a, score_b, new Date().toISOString()]],
          },
        });
        return res.json({
          message: 'Pronóstico actualizado',
          prediction: { email, match_id, score_a, score_b },
        });
      } else {
        // Append new row
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.SHEET_ID,
          range: 'predictions!A:E',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[email, match_id, score_a, score_b, new Date().toISOString()]],
          },
        });
        return res.status(201).json({
          message: 'Pronóstico guardado',
          prediction: { email, match_id, score_a, score_b },
        });
      }
    } catch (err) {
      console.error('[api/predictions POST]', err.message);
      return res.status(500).json({ error: 'Error al guardar el pronóstico' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
