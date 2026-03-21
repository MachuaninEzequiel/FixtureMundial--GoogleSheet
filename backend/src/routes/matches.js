const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

// GET /api/matches - all matches with user prediction (if authenticated)
router.get('/', (req, res) => {
  const authHeader = req.headers['authorization'];
  let userId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      userId = payload.id;
    } catch (_) {}
  }

  const matches = db.prepare('SELECT * FROM matches ORDER BY match_date ASC').all();

  if (userId) {
    const predictions = db.prepare(
      'SELECT * FROM predictions WHERE user_id = ?'
    ).all(userId);
    const predMap = {};
    predictions.forEach(p => { predMap[p.match_id] = p; });

    return res.json(matches.map(m => ({
      ...m,
      userPrediction: predMap[m.id] || null
    })));
  }

  res.json(matches.map(m => ({ ...m, userPrediction: null })));
});



module.exports = router;
