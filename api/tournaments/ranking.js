const { getSheetsClient } = require('../_lib/sheets');
const { verifyToken } = require('../_lib/auth');

/**
 * GET /api/tournaments/ranking?id=CODE
 * Returns the filtered global ranking for a specific private tournament.
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
    const tournamentId = req.query.id;

    if (!tournamentId) {
      return res.status(400).json({ error: 'Tournament ID is required' });
    }

    const sheets = getSheetsClient();
    
    // 1. Get Tournament details to find the members list
    const { data: tData } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'tournaments!A2:E',
    });

    const tRows = tData.values || [];
    const tRow = tRows.find(row => row[0]?.toUpperCase() === tournamentId.toUpperCase());

    if (!tRow) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    const membersStr = (tRow[4] || '').toLowerCase();
    const membersList = membersStr.split(',').map(m => m.trim()).filter(Boolean);

    // Verify authorized access (user must be a member to see the ranking)
    if (!membersList.includes(userEmail)) {
      return res.status(403).json({ error: 'No perteneces a este torneo' });
    }

    const tournamentDetails = {
      id: tRow[0],
      name: tRow[1],
      description: tRow[2],
      ownerEmail: tRow[3],
    };

    // 2. Read Global Ranking
    const { data: rData } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'ranking!A2:E', // email | username | pts | total_pred | correct_pred
    });

    const rRows = rData.values || [];

    // Filter global ranking rows to only keep members of THIS tournament
    const ranking = rRows
      .filter(row => row[0] && membersList.includes(row[0].toLowerCase()))
      .map(row => ({
        email: row[0] || '',
        username: row[1] || '',
        total_points: Number(row[2] || 0),
        total_predictions: Number(row[3] || 0),
        correct_predictions: Number(row[4] || 0),
      }))
      .sort((a, b) =>
        b.total_points - a.total_points ||
        b.correct_predictions - a.correct_predictions ||
        a.username.localeCompare(b.username)
      )
      .map((entry, i) => ({ ...entry, position: i + 1 }));

    return res.json({
      tournament: tournamentDetails,
      ranking
    });

  } catch (err) {
    console.error('[tournaments/ranking]', err);
    return res.status(500).json({ error: err.message || 'Error al obtener el ranking del torneo' });
  }
};
