const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

// POST /api/predictions - create or update a prediction
router.post('/', authenticate, (req, res) => {
  const { match_id, score_a, score_b } = req.body;

  if (match_id === undefined || score_a === undefined || score_b === undefined) {
    return res.status(400).json({ error: 'match_id, score_a y score_b son requeridos' });
  }
  if (score_a < 0 || score_b < 0 || !Number.isInteger(score_a) || !Number.isInteger(score_b)) {
    return res.status(400).json({ error: 'Los marcadores deben ser enteros no negativos' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(match_id);
  if (!match) return res.status(404).json({ error: 'Partido no encontrado' });

  // Block predictions 5 minutes before match starts
  const LOCKOUT_BUFFER = 5 * 60; // 300 seconds
  const now = Math.floor(Date.now() / 1000);
  if (match.match_date && now >= match.match_date - LOCKOUT_BUFFER) {
    return res.status(403).json({ error: 'Las predicciones para este partido están cerradas (cierre 5 min antes del inicio).' });
  }

  const existing = db.prepare(
    'SELECT id FROM predictions WHERE user_id = ? AND match_id = ?'
  ).get(req.user.id, match_id);

  if (existing) {
    db.prepare(
      'UPDATE predictions SET score_a = ?, score_b = ?, updated_at = unixepoch() WHERE id = ?'
    ).run(score_a, score_b, existing.id);
    const updated = db.prepare('SELECT * FROM predictions WHERE id = ?').get(existing.id);
    return res.json({ message: 'Pronóstico actualizado', prediction: updated });
  }

  const result = db.prepare(
    'INSERT INTO predictions (user_id, match_id, score_a, score_b) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, match_id, score_a, score_b);

  const prediction = db.prepare('SELECT * FROM predictions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Pronóstico guardado', prediction });
});

// GET /api/predictions - all predictions for the authenticated user
router.get('/', authenticate, (req, res) => {
  const predictions = db.prepare(`
    SELECT p.*, m.team_a, m.flag_a, m.team_b, m.flag_b, m.phase, m.group_name,
           m.match_date, m.real_score_a, m.real_score_b, m.status
    FROM predictions p
    JOIN matches m ON p.match_id = m.id
    WHERE p.user_id = ?
    ORDER BY m.match_date ASC
  `).all(req.user.id);

  res.json(predictions);
});

module.exports = router;
