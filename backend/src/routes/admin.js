const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

// Middleware: only allow admin users
function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.id);
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }
    next();
  });
}

// GET /api/admin/users — list all users with stats
router.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT
      u.id, u.username, u.email, u.status, u.is_admin,
      u.created_at,
      COUNT(p.id) AS total_predictions,
      COALESCE(SUM(p.points_earned), 0) AS total_points
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at ASC
  `).all();
  res.json(users);
});

// PATCH /api/admin/users/:id/approve
router.patch('/users/:id/approve', requireAdmin, (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").run(id);
  res.json({ message: `Usuario "${user.username}" aprobado correctamente.` });
});

// PATCH /api/admin/users/:id/reject
router.patch('/users/:id/reject', requireAdmin, (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(id);
  res.json({ message: `Usuario "${user.username}" rechazado.` });
});

// PATCH /api/admin/users/:id/pending  (revert to pending)
router.patch('/users/:id/pending', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare("UPDATE users SET status = 'pending' WHERE id = ?").run(id);
  res.json({ message: 'Usuario vuelto a estado pendiente.' });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.is_admin) return res.status(403).json({ error: 'No podés eliminar al administrador.' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'Usuario eliminado.' });
});

// PATCH /api/admin/matches/:id/result - set real result
router.patch('/matches/:id/result', requireAdmin, (req, res) => {
  const { score_a, score_b } = req.body;
  
  if (score_a === undefined || score_b === undefined) {
    return res.status(400).json({ error: 'score_a y score_b son requeridos' });
  }

  const matchId = parseInt(req.params.id);
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) return res.status(404).json({ error: 'Partido no encontrado' });

  // Update match result
  db.prepare('UPDATE matches SET real_score_a = ?, real_score_b = ?, status = ? WHERE id = ?')
    .run(score_a, score_b, 'finished', matchId);

  // Determine real result: 'a' win | 'draw' | 'b' win
  const realResult = score_a > score_b ? 'a' : score_a < score_b ? 'b' : 'draw';

  // Calculate points for all predictions of this match
  const predictions = db.prepare('SELECT * FROM predictions WHERE match_id = ?').all(matchId);

  const updatePoints = db.prepare('UPDATE predictions SET points_earned = ? WHERE id = ?');

  const calcAll = db.transaction(() => {
    for (const pred of predictions) {
      // 3 points for exact score, 1 point for correct outcome
      let points = 0;
      if (pred.score_a === score_a && pred.score_b === score_b) {
        points = 3; // EXACT MATCH
      } else {
        const predResult = pred.score_a > pred.score_b ? 'a' : pred.score_a < pred.score_b ? 'b' : 'draw';
        if (predResult === realResult) {
          points = 1; // CORRECT OUTCOME
        }
      }
      updatePoints.run(points, pred.id);
    }
  });

  calcAll();

  res.json({
    message: `Resultado guardado. ${predictions.length} pronósticos actualizados.`,
    real_score_a: score_a,
    real_score_b: score_b
  });
});

module.exports = router;
