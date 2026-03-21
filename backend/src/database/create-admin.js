require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('./db');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('❌ Definí ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
  db.prepare('UPDATE users SET is_admin = 1, status = ? WHERE email = ?')
    .run('approved', email);
  console.log(`✅ Usuario "${email}" actualizado a administrador.`);
} else {
  const hash = bcrypt.hashSync(password, 10);
  const username = process.env.ADMIN_USERNAME || 'admin';
  db.prepare(
    'INSERT INTO users (username, email, password_hash, is_admin, status) VALUES (?, ?, ?, 1, ?)'
  ).run(username, email, hash, 'approved');
  console.log(`✅ Usuario administrador "${username}" (${email}) creado correctamente.`);
}
