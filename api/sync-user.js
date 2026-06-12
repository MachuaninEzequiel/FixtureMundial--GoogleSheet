const { getSheetsClient } = require('./_lib/sheets');
const { verifyToken } = require('./_lib/auth');

/**
 * POST /api/sync-user
 * Llamado por AuthContext en cada login.
 * La hoja `ranking` es solo el registro de usuarios (email + username);
 * los puntos se calculan en código (api/_lib/ranking.js).
 * - Si el usuario NO existe en la hoja ranking: agrega la fila con email y username.
 * - Si el usuario existe pero cambió el displayName: actualiza solo la col B.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let decodedToken;
  try {
    decodedToken = await verifyToken(req);
  } catch {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const email = decodedToken.email;
  const displayName = req.body?.displayName || decodedToken.name || email.split('@')[0];

  try {
    const sheets = getSheetsClient();

    // Leer col A y B de ranking para verificar si el usuario ya existe
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'ranking!A2:B',
    });

    const rows = data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === email);

    if (rowIndex === -1) {
      // ── Usuario nuevo: append email + username ──
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'ranking!A:B',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [[email, displayName]] },
      });

      return res.json({ ok: true, action: 'created' });
    } else {
      // ── Usuario existente: actualizar displayName si cambió ──
      if (rows[rowIndex][1] !== displayName) {
        const existingRowNum = rowIndex + 2; // +1 header +1 0-index
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: `ranking!B${existingRowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[displayName]] },
        });
        return res.json({ ok: true, action: 'updated', row: existingRowNum });
      }
      return res.json({ ok: true, action: 'no_change' });
    }
  } catch (err) {
    console.error('[api/sync-user]', err.message);
    // No bloqueamos el login aunque falle
    return res.status(500).json({ error: 'Error al sincronizar usuario' });
  }
};
