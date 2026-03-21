const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

// Create email transporter (falls back to console if not configured)
function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendResetEmail(to, resetUrl) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[DEV - sin SMTP] Reset link para ${to}:\n${resetUrl}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `FixtureMundial 2026 <${process.env.SMTP_USER}>`,
    to,
    subject: '🌍 Restablecé tu contraseña — FixtureMundial 2026',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0a0f1c;padding:40px 20px;">
        <div style="max-width:480px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
          <div style="background:linear-gradient(135deg,#f5c518,#f97316);padding:28px;text-align:center">
            <h1 style="font-size:28px;color:#000;margin:0;letter-spacing:4px;font-weight:900;">FIXTURE MUNDIAL</h1>
            <p style="color:#000;margin:4px 0 0;font-size:14px;">2026</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#f1f5f9;margin:0 0 12px;">Restablecer contraseña</h2>
            <p style="color:#94a3b8;line-height:1.6;margin:0 0 24px;">Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón de abajo para crear una nueva. Este enlace expira en <strong style="color:#f5c518;">1 hora</strong>.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#f5c518,#f97316);color:#000;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;text-decoration:none;">Restablecer contraseña</a>
            </div>
            <p style="color:#475569;font-size:12px;margin:0;">Si no solicitaste esto, ignorá este email. Tu contraseña no cambiará.</p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:20px 0;">
            <p style="color:#475569;font-size:11px;margin:0;">O copiá este enlace: <a href="${resetUrl}" style="color:#f5c518;">${resetUrl}</a></p>
          </div>
        </div>
      </div>
    `,
  });
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'El email o nombre de usuario ya está en uso' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    "INSERT INTO users (username, email, password_hash, status) VALUES (?, ?, ?, 'pending')"
  ).run(username, email, hash);

  // Do NOT issue a token — user must wait for admin approval
  res.status(201).json({
    pending: true,
    message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.'
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Check account status
  if (user.status === 'pending') {
    return res.status(403).json({ code: 'PENDING_APPROVAL', error: 'Tu cuenta está pendiente de aprobación por el administrador.' });
  }
  if (user.status === 'rejected') {
    return res.status(403).json({ code: 'ACCOUNT_REJECTED', error: 'Tu cuenta ha sido rechazada. Contactá al administrador.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin }
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, email, is_admin, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const totalPoints = db.prepare(
    'SELECT COALESCE(SUM(points_earned), 0) as total FROM predictions WHERE user_id = ?'
  ).get(req.user.id);

  res.json({ ...user, totalPoints: totalPoints.total });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

  // Always return success to prevent email enumeration
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour
    db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?')
      .run(token, expires, user.id);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    try {
      await sendResetEmail(email, resetUrl);
    } catch (err) {
      console.error('[Email error]', err.message);
    }
  }

  res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña son requeridos' });
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const user = db.prepare(
    'SELECT id FROM users WHERE reset_token = ? AND reset_expires > ?'
  ).get(token, Date.now());

  if (!user) return res.status(400).json({ error: 'Token inválido o expirado' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?')
    .run(hash, user.id);

  res.json({ message: 'Contraseña actualizada correctamente' });
});

module.exports = router;
