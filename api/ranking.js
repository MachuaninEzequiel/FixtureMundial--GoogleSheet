const { getSheetsClient } = require('./_lib/sheets');

/**
 * GET /api/ranking
 * Public endpoint — reads the 'ranking' sheet which is populated by
 * native Google Sheets formulas (no code calculations).
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sheets = getSheetsClient();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'ranking!A2:E', // email | username | total_points | total_predictions | correct_predictions
    });

    const rows = data.values || [];

    // Filter out empty rows (Google Sheets formulas may produce empty rows)
    const ranking = rows
      .filter((row) => row[0] && row[1])
      .map((row) => ({
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

    return res.json(ranking);
  } catch (err) {
    console.error('[api/ranking]', err.message);
    return res.status(500).json({ error: 'Error al obtener el ranking' });
  }
};
