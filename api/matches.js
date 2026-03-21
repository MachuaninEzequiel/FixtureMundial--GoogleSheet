const { getSheetsClient } = require('./_lib/sheets');

/**
 * GET /api/matches
 * Public endpoint — returns all matches from the 'matches' sheet.
 * No authentication required.
 */
module.exports = async (req, res) => {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sheets = getSheetsClient();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'matches!A2:K', // Row 1 is the header
    });

    const rows = data.values || [];
    const matches = rows.map((row) => ({
      id: Number(row[0]),
      team_a: row[1] || '',
      flag_a: row[2] || '',
      team_b: row[3] || '',
      flag_b: row[4] || '',
      phase: row[5] || '',
      group_name: row[6] || null,
      match_date: row[7] ? Number(row[7]) : null,
      real_score_a: row[8] !== undefined && row[8] !== '' ? Number(row[8]) : null,
      real_score_b: row[9] !== undefined && row[9] !== '' ? Number(row[9]) : null,
      status: row[10] || 'scheduled',
    }));
    return res.json(matches);
  } catch (err) {
    console.error('[api/matches] ERROR:', err);
    return res.status(500).json({ error: 'Error al obtener los partidos: ' + err.message, sheet_id: !!process.env.SHEET_ID });
  }
};
