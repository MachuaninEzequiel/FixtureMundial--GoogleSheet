const { getSheetsClient } = require('../_lib/sheets');
const { verifyToken } = require('../_lib/auth');
const crypto = require('crypto');

/**
 * POST /api/tournaments/create
 * Body: { name, description }
 * Creates a new private tournament.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const decodedToken = await verifyToken(req);
    const ownerEmail = decodedToken.email;
    const { name, description = '' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre del torneo es obligatorio' });
    }

    const sheets = getSheetsClient();
    
    // Generate a 6-character alphanumeric invite code (uppercase)
    const id = crypto.randomBytes(3).toString('hex').toUpperCase();
    const createdAt = new Date().toISOString();
    
    // Initial members list is just the owner
    const members = ownerEmail;

    const rowData = [id, name, description, ownerEmail, members, createdAt];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: 'tournaments!A:F',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowData] },
    });

    return res.status(201).json({ 
      ok: true, 
      tournament: { id, name, description, ownerEmail, members: [ownerEmail], createdAt }
    });

  } catch (err) {
    console.error('[tournaments/create]', err);
    return res.status(500).json({ error: err.message || 'Error al crear el torneo' });
  }
};
