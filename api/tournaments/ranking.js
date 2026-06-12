const { getSheetsClient } = require('../_lib/sheets');
const { verifyToken } = require('../_lib/auth');
const { computeRanking } = require('../_lib/ranking');

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

    // 2. Compute the global ranking in code (already sorted) and keep only
    //    members of THIS tournament, re-numbering positions within the league
    const ranking = (await computeRanking(sheets))
      .filter((entry) => membersList.includes(entry.email.toLowerCase()))
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
