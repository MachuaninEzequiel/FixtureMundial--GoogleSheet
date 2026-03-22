const { getSheetsClient } = require('../_lib/sheets');
const { verifyToken } = require('../_lib/auth');

/**
 * POST /api/tournaments/join
 * Body: { code } (if self-joining via code) OR { code, emailToAdd } (if owner is adding manually)
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
    
    const { code, emailToAdd } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Se requiere el código de invitación del torneo' });
    }

    const targetEmail = (emailToAdd || requesterEmail).toLowerCase().trim();

    const sheets = getSheetsClient();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'tournaments!A1:F',
    });

    const rows = data.values || [];
    const rowIndex = rows.findIndex(row => row[0]?.toUpperCase() === code.toUpperCase());

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'No se encontró ningún torneo con este código' });
    }

    const row = rows[rowIndex];
    const ownerEmail = (row[3] || '').trim().toLowerCase();
    let membersStr = row[4] || '';
    const membersList = membersStr.split(',').map(m => m.trim().toLowerCase()).filter(Boolean);

    // If owner is trying to add someone, verify they are actually the owner
    if (emailToAdd && requesterEmail !== ownerEmail) {
      return res.status(403).json({ error: 'Solo el creador del torneo puede agregar emails manualmente' });
    }

    if (membersList.includes(targetEmail)) {
      return res.status(400).json({ error: 'El usuario ya pertenece a este torneo' });
    }

    // Append targetEmail to members list
    membersList.push(targetEmail);
    const newMembersStr = membersList.join(',');

    // Update the cell (Column E = 5th col -> E1, E2, etc)
    const cellRange = `tournaments!E${rowIndex + 1}`; // +1 for 1-based indexing of Sheets
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: cellRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newMembersStr]] },
    });

    return res.json({ 
      ok: true, 
      message: emailToAdd ? 'Usuario agregado exitosamente' : 'Te uniste al torneo exitosamente',
      membersCount: membersList.length
    });

  } catch (err) {
    console.error('[tournaments/join]', err);
    return res.status(500).json({ error: err.message || 'Error al unirse al torneo' });
  }
};
