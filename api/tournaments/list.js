const { getSheetsClient } = require('../_lib/sheets');
const { verifyToken } = require('../_lib/auth');

/**
 * GET /api/tournaments/list
 * Returns all tournaments where the user is a member.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const decodedToken = await verifyToken(req);
    const userEmail = decodedToken.email.toLowerCase();

    const sheets = getSheetsClient();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'tournaments!A2:F',
    });

    const rows = data.values || [];
    
    // Filter tournaments where members array includes userEmail
    const userTournaments = rows
      .filter(row => {
        const membersStr = (row[4] || '').toLowerCase();
        const membersList = membersStr.split(',').map(m => m.trim());
        return membersList.includes(userEmail);
      })
      .map(row => ({
        id: row[0],
        name: row[1],
        description: row[2],
        ownerEmail: row[3],
        members: (row[4] || '').split(',').map(m => m.trim()),
        createdAt: row[5],
      }));

    return res.json(userTournaments);

  } catch (err) {
    console.error('[tournaments/list]', err);
    return res.status(500).json({ error: err.message || 'Error al obtener torneos' });
  }
};
