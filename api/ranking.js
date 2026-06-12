const { getSheetsClient } = require('./_lib/sheets');
const { computeRanking } = require('./_lib/ranking');

/**
 * GET /api/ranking
 * Public endpoint — computes the ranking in code (scale 5/4/2/0) from the
 * `predictions` and `matches` sheets. The `ranking` sheet only provides the
 * user registry (email + username).
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sheets = getSheetsClient();
    const ranking = (await computeRanking(sheets))
      .map((entry, i) => ({ ...entry, position: i + 1 }));

    return res.json(ranking);
  } catch (err) {
    console.error('[api/ranking]', err.message);
    return res.status(500).json({ error: 'Error al obtener el ranking' });
  }
};
