const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/ranking - global leaderboard
router.get('/', (req, res) => {
  const ranking = db.prepare(`
    SELECT 
      u.id,
      u.username,
      COALESCE(SUM(p.points_earned), 0) as total_points,
      COUNT(p.id) as total_predictions,
      SUM(CASE WHEN p.points_earned = 3 THEN 1 ELSE 0 END) as correct_predictions
    FROM users u
    LEFT JOIN predictions p ON u.id = p.user_id
    GROUP BY u.id
    ORDER BY total_points DESC, correct_predictions DESC, u.username ASC
  `).all();

  const rankedUsers = ranking.map((user, index) => ({
    ...user,
    position: index + 1
  }));

  res.json(rankedUsers);
});

module.exports = router;
