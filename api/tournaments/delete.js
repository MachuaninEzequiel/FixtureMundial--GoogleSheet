const { getSheetsClient } = require('../_lib/sheets');
const { verifyToken } = require('../_lib/auth');

/**
 * POST /api/tournaments/delete
 * Body: { id, confirmName }
 * Solo el owner puede eliminar. Exige confirmar tipeando el nombre del torneo
 * para evitar borrados accidentales.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const decodedToken = await verifyToken(req);
    const requesterEmail = decodedToken.email.toLowerCase();

    const { id, confirmName } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id del torneo' });
    if (!confirmName) return res.status(400).json({ error: 'Falta confirmar el nombre del torneo' });

    const sheets = getSheetsClient();

    // Necesitamos el gid de la hoja `tournaments` para borrar la fila
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: process.env.SHEET_ID });
    const sheetMeta = spreadsheet.data.sheets.find((s) => s.properties.title === 'tournaments');
    if (!sheetMeta) return res.status(500).json({ error: 'Hoja tournaments no encontrada' });
    const sheetGid = sheetMeta.properties.sheetId;

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'tournaments!A2:F',
    });

    const rows = data.values || [];
    const rowIndex = rows.findIndex((row) => row[0]?.toUpperCase() === id.toUpperCase());
    if (rowIndex === -1) return res.status(404).json({ error: 'Torneo no encontrado' });

    const row = rows[rowIndex];
    const ownerEmail = (row[3] || '').trim().toLowerCase();
    if (ownerEmail !== requesterEmail) {
      return res.status(403).json({ error: 'Solo el creador puede eliminar el torneo' });
    }

    if (String(confirmName).trim() !== String(row[1] || '').trim()) {
      return res.status(400).json({ error: 'El nombre de confirmación no coincide' });
    }

    // Borrar fila vía batchUpdate (deleteDimension trabaja con índices base-0,
    // incluyendo la fila header en index 0 → la fila de datos rowIndex está en
    // startIndex = rowIndex + 1)
    const startIndex = rowIndex + 1;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetGid,
                dimension: 'ROWS',
                startIndex,
                endIndex: startIndex + 1,
              },
            },
          },
        ],
      },
    });

    return res.json({ ok: true, deletedId: row[0] });
  } catch (err) {
    console.error('[tournaments/delete]', err);
    return res.status(500).json({ error: err.message || 'Error al eliminar el torneo' });
  }
};
