const { getSheetsClient } = require('./_lib/sheets');
const { verifyToken } = require('./_lib/auth');

// Fórmulas de ranking — se escriben en C, D, E de cada fila nueva del usuario.
// Usan referencias absolutas ($) para que funcionen en cualquier fila.
function rankingFormulas(rowNum) {
  return [
    // C: total_points — 3 pts si el pronóstico exacto coincide con el resultado real
    `=IF(A${rowNum}="","",SUMPRODUCT((predictions!$A$2:$A$5000=A${rowNum})*(predictions!$C$2:$C$5000=IFERROR(INDEX(matches!$I$2:$I$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),-999))*(predictions!$D$2:$D$5000=IFERROR(INDEX(matches!$J$2:$J$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),-999))*3))`,
    // D: total_predictions — total de pronósticos del usuario
    `=IF(A${rowNum}="","",COUNTIF(predictions!$A$2:$A$5000,A${rowNum}))`,
    // E: correct_predictions — pronósticos exactamente correctos
    `=IF(A${rowNum}="","",SUMPRODUCT((predictions!$A$2:$A$5000=A${rowNum})*(predictions!$C$2:$C$5000=IFERROR(INDEX(matches!$I$2:$I$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),-999))*(predictions!$D$2:$D$5000=IFERROR(INDEX(matches!$J$2:$J$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),-999))))`,
  ];
}

/**
 * POST /api/sync-user
 * Llamado por AuthContext en cada login.
 * - Si el usuario NO existe en la hoja ranking: agrega la fila con email, username y fórmulas C/D/E.
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
      // ── Usuario nuevo: append email + username, luego escribir fórmulas en C, D, E ──
      const appendRes = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'ranking!A:B',
        valueInputOption: 'USER_ENTERED',
        // includeValuesInResponse + insertDataOption nos dan la fila exacta insertada
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [[email, displayName]] },
      });

      // La API de append devuelve el rango actualizado, ej: "ranking!A5:B5"
      // Extraemos el número de fila de ese rango
      const updatedRange = appendRes.data.updates?.updatedRange || '';
      const rowMatch = updatedRange.match(/(\d+)$/);
      const newRowNum = rowMatch ? parseInt(rowMatch[1]) : rows.length + 2;

      // Escribir fórmulas en C, D, E de la fila recién creada
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `ranking!C${newRowNum}:E${newRowNum}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rankingFormulas(newRowNum)] },
      });

      return res.json({ ok: true, action: 'created', row: newRowNum });
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
