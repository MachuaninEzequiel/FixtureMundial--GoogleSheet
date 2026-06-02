const { getSheetsClient } = require('../_lib/sheets');
const { verifyToken } = require('../_lib/auth');

/**
 * POST /api/tournaments/update
 * Body: { id, name?, description? }
 * Solo el owner puede modificar nombre/descripción.
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

    const { id, name, description } = req.body || {};

    if (!id) return res.status(400).json({ error: 'Falta el id del torneo' });
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }

    const sheets = getSheetsClient();
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
      return res.status(403).json({ error: 'Solo el creador puede modificar el torneo' });
    }

    const newName = name !== undefined ? String(name).trim() : row[1];
    const newDescription = description !== undefined ? String(description) : (row[2] || '');

    const rowNumber = rowIndex + 2; // +1 header, +1 0-index
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: `tournaments!B${rowNumber}:C${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newName, newDescription]] },
    });

    return res.json({
      ok: true,
      tournament: {
        id: row[0],
        name: newName,
        description: newDescription,
        ownerEmail: row[3],
        members: (row[4] || '').split(',').map((m) => m.trim()).filter(Boolean),
        createdAt: row[5],
      },
    });
  } catch (err) {
    console.error('[tournaments/update]', err);
    return res.status(500).json({ error: err.message || 'Error al actualizar el torneo' });
  }
};
