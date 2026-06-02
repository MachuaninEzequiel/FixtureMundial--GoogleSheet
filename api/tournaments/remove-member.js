const { getSheetsClient } = require('../_lib/sheets');
const { verifyToken } = require('../_lib/auth');

/**
 * POST /api/tournaments/remove-member
 * Body: { id, emailToRemove }
 * Solo el owner puede sacar miembros. El owner no puede sacarse a sí mismo.
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

    const { id, emailToRemove } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id del torneo' });
    if (!emailToRemove) return res.status(400).json({ error: 'Falta el email a remover' });

    const target = String(emailToRemove).toLowerCase().trim();

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
      return res.status(403).json({ error: 'Solo el creador puede sacar miembros' });
    }

    if (target === ownerEmail) {
      return res.status(400).json({ error: 'El creador no puede sacarse a sí mismo del torneo' });
    }

    const membersList = (row[4] || '')
      .split(',')
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);

    if (!membersList.includes(target)) {
      return res.status(404).json({ error: 'Ese email no está en el torneo' });
    }

    const newMembers = membersList.filter((m) => m !== target);
    const rowNumber = rowIndex + 2; // +1 header, +1 0-index
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: `tournaments!E${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newMembers.join(',')]] },
    });

    return res.json({
      ok: true,
      removedEmail: target,
      members: newMembers,
    });
  } catch (err) {
    console.error('[tournaments/remove-member]', err);
    return res.status(500).json({ error: err.message || 'Error al sacar al miembro' });
  }
};
