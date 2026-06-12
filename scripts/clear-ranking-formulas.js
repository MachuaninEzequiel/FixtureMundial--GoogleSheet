/**
 * clear-ranking-formulas.js — limpieza one-shot
 *
 * Borra las columnas C:E de la hoja `ranking` (las viejas fórmulas SUMPRODUCT,
 * que además estaban rotas: INDEX+MATCH no se expande como array dentro de
 * SUMPRODUCT y comparaba todas las predicciones contra el partido 1).
 *
 * Desde ahora los puntos se calculan en código (api/_lib/ranking.js) y la hoja
 * `ranking` es solo el registro de usuarios (email + username).
 *
 * ⚠️ Correr SOLO después de deployar el código nuevo: la versión vieja de
 * api/ranking.js lee estas columnas y mostraría 0 puntos para todos.
 *
 * Uso: node scripts/clear-ranking-formulas.js
 */

require('dotenv').config();
const { google } = require('googleapis');

async function main() {
  if (!process.env.SHEET_ID) { console.error('❌ SHEET_ID no configurado'); process.exit(1); }
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON no configurado'); process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: process.env.SHEET_ID,
    range: 'ranking!C2:E',
  });

  console.log('✅ Columnas C:E de la hoja ranking limpiadas.');
}

main().catch((err) => { console.error('❌', err.message); process.exit(1); });
