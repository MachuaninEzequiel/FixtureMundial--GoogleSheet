/**
 * seed-sheets.js — Inicialización del Google Sheet para FixtureMundial 2026
 * Crea las 3 hojas (matches, predictions, ranking) con encabezados y
 * carga los 72 partidos de la Fase de Grupos + placeholders para eliminatorias.
 *
 * Uso: node scripts/seed-sheets.js
 */

require('dotenv').config();
const { google } = require('googleapis');

const SHEET_ID = process.env.SHEET_ID;

async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ─── Timestamps ARG-03:00 → UTC ──────────────────────────────────────────────
// Offset ARG = UTC-3, entonces hora ARG = hora UTC - 3  ➜  hora UTC = hora ARG + 3
function ts(year, month, day, hourARG, min = 0) {
  return Math.floor(Date.UTC(year, month - 1, day, hourARG + 3, min) / 1000);
}

// ─── Partidos: Fase de Grupos ─────────────────────────────────────────────────
// Cols: id, team_a, flag_a, team_b, flag_b, phase, group_name, match_date_unix, real_score_a, real_score_b, status
const MATCHES = [
  // ──── 11 JUN ────
  [1,  'México',         'MX', 'Sudáfrica',        'ZA', 'groups', 'A', ts(2026,6,11,16), '', '', 'scheduled'],
  [2,  'Corea del Sur',  'KR', 'Dinamarca',         'DK', 'groups', 'A', ts(2026,6,11,23), '', '', 'scheduled'],
  // ──── 12 JUN ────
  [3,  'Canadá',         'CA', 'Italia',            'IT', 'groups', 'B', ts(2026,6,12,16), '', '', 'scheduled'],
  [4,  'Estados Unidos', 'US', 'Paraguay',          'PY', 'groups', 'D', ts(2026,6,12,22), '', '', 'scheduled'],
  // ──── 13 JUN ────
  [5,  'Qatar',          'QA', 'Suiza',             'CH', 'groups', 'B', ts(2026,6,13,16), '', '', 'scheduled'],
  [6,  'Brasil',         'BR', 'Marruecos',         'MA', 'groups', 'C', ts(2026,6,13,19), '', '', 'scheduled'],
  [7,  'Haití',          'HT', 'Escocia',           'GB-SCT', 'groups', 'C', ts(2026,6,13,22), '', '', 'scheduled'],
  [8,  'Australia',      'AU', 'Turquía',           'TR', 'groups', 'D', ts(2026,6,14,1),  '', '', 'scheduled'],
  // ──── 14 JUN ────
  [9,  'Alemania',       'DE', 'Curazao',           'CW', 'groups', 'E', ts(2026,6,14,14), '', '', 'scheduled'],
  [10, 'Países Bajos',   'NL', 'Japón',             'JP', 'groups', 'F', ts(2026,6,14,17), '', '', 'scheduled'],
  [11, 'Costa de Marfil','CI', 'Ecuador',           'EC', 'groups', 'E', ts(2026,6,14,20), '', '', 'scheduled'],
  [12, 'Ucrania',        'UA', 'Túnez',             'TN', 'groups', 'F', ts(2026,6,14,23), '', '', 'scheduled'],
  // ──── 15 JUN ────
  [13, 'España',         'ES', 'Cabo Verde',        'CV', 'groups', 'H', ts(2026,6,15,13), '', '', 'scheduled'],
  [14, 'Bélgica',        'BE', 'Egipto',            'EG', 'groups', 'G', ts(2026,6,15,16), '', '', 'scheduled'],
  [15, 'Arabia Saudita', 'SA', 'Uruguay',           'UY', 'groups', 'H', ts(2026,6,15,19), '', '', 'scheduled'],
  [16, 'Irán',           'IR', 'Nueva Zelanda',     'NZ', 'groups', 'G', ts(2026,6,15,22), '', '', 'scheduled'],
  // ──── 16 JUN ────
  [17, 'Francia',        'FR', 'Senegal',           'SN', 'groups', 'I', ts(2026,6,16,16), '', '', 'scheduled'],
  [18, 'Irak',           'IQ', 'Noruega',           'NO', 'groups', 'I', ts(2026,6,16,19), '', '', 'scheduled'],
  [19, 'Argentina',      'AR', 'Argelia',           'DZ', 'groups', 'J', ts(2026,6,16,22), '', '', 'scheduled'],
  [20, 'Austria',        'AT', 'Jordania',          'JO', 'groups', 'J', ts(2026,6,17,1),  '', '', 'scheduled'],
  // ──── 17 JUN ────
  [21, 'Portugal',       'PT', 'Jamaica',           'JM', 'groups', 'K', ts(2026,6,17,14), '', '', 'scheduled'],
  [22, 'Inglaterra',     'GB-ENG', 'Croacia',        'HR', 'groups', 'L', ts(2026,6,17,17), '', '', 'scheduled'],
  [23, 'Ghana',          'GH', 'Panamá',            'PA', 'groups', 'L', ts(2026,6,17,20), '', '', 'scheduled'],
  [24, 'Uzbekistán',     'UZ', 'Colombia',          'CO', 'groups', 'K', ts(2026,6,17,23), '', '', 'scheduled'],
  // ──── 18 JUN ────
  [25, 'Dinamarca',      'DK', 'Sudáfrica',         'ZA', 'groups', 'A', ts(2026,6,18,13), '', '', 'scheduled'],
  [26, 'Suiza',          'CH', 'Italia',            'IT', 'groups', 'B', ts(2026,6,18,16), '', '', 'scheduled'],
  [27, 'Canadá',         'CA', 'Qatar',             'QA', 'groups', 'B', ts(2026,6,18,19), '', '', 'scheduled'],
  [28, 'México',         'MX', 'Corea del Sur',     'KR', 'groups', 'A', ts(2026,6,18,22), '', '', 'scheduled'],
  // ──── 19 JUN ────
  [29, 'Estados Unidos', 'US', 'Australia',         'AU', 'groups', 'D', ts(2026,6,19,16), '', '', 'scheduled'],
  [30, 'Escocia',        'GB-SCT', 'Marruecos',     'MA', 'groups', 'C', ts(2026,6,19,19), '', '', 'scheduled'],
  [31, 'Brasil',         'BR', 'Haití',             'HT', 'groups', 'C', ts(2026,6,19,22), '', '', 'scheduled'],
  [32, 'Turquía',        'TR', 'Paraguay',          'PY', 'groups', 'D', ts(2026,6,20,1),  '', '', 'scheduled'],
  // ──── 20 JUN ────
  [33, 'Países Bajos',   'NL', 'Ucrania',           'UA', 'groups', 'F', ts(2026,6,20,14), '', '', 'scheduled'],
  [34, 'Alemania',       'DE', 'Costa de Marfil',   'CI', 'groups', 'E', ts(2026,6,20,17), '', '', 'scheduled'],
  [35, 'Ecuador',        'EC', 'Curazao',           'CW', 'groups', 'E', ts(2026,6,20,21), '', '', 'scheduled'],
  [36, 'Túnez',          'TN', 'Japón',             'JP', 'groups', 'F', ts(2026,6,21,1),  '', '', 'scheduled'],
  // ──── 21 JUN ────
  [37, 'España',         'ES', 'Arabia Saudita',    'SA', 'groups', 'H', ts(2026,6,21,13), '', '', 'scheduled'],
  [38, 'Bélgica',        'BE', 'Irán',              'IR', 'groups', 'G', ts(2026,6,21,16), '', '', 'scheduled'],
  [39, 'Uruguay',        'UY', 'Cabo Verde',        'CV', 'groups', 'H', ts(2026,6,21,19), '', '', 'scheduled'],
  [40, 'Nueva Zelanda',  'NZ', 'Egipto',            'EG', 'groups', 'G', ts(2026,6,21,22), '', '', 'scheduled'],
  // ──── 22 JUN ────
  [41, 'Argentina',      'AR', 'Austria',           'AT', 'groups', 'J', ts(2026,6,22,14), '', '', 'scheduled'],
  [42, 'Francia',        'FR', 'Irak',              'IQ', 'groups', 'I', ts(2026,6,22,18), '', '', 'scheduled'],
  [43, 'Noruega',        'NO', 'Senegal',           'SN', 'groups', 'I', ts(2026,6,22,21), '', '', 'scheduled'],
  [44, 'Jordania',       'JO', 'Argelia',           'DZ', 'groups', 'J', ts(2026,6,23,0),  '', '', 'scheduled'],
  // ──── 23 JUN ────
  [45, 'Portugal',       'PT', 'Uzbekistán',        'UZ', 'groups', 'K', ts(2026,6,23,14), '', '', 'scheduled'],
  [46, 'Inglaterra',     'GB-ENG', 'Ghana',          'GH', 'groups', 'L', ts(2026,6,23,17), '', '', 'scheduled'],
  [47, 'Panamá',         'PA', 'Croacia',           'HR', 'groups', 'L', ts(2026,6,23,20), '', '', 'scheduled'],
  [48, 'Colombia',       'CO', 'Jamaica',           'JM', 'groups', 'K', ts(2026,6,23,23), '', '', 'scheduled'],
  // ──── 24 JUN ────
  [49, 'Suiza',          'CH', 'Canadá',            'CA', 'groups', 'B', ts(2026,6,24,16), '', '', 'scheduled'],
  [50, 'Italia',         'IT', 'Qatar',             'QA', 'groups', 'B', ts(2026,6,24,16), '', '', 'scheduled'],
  [51, 'Marruecos',      'MA', 'Haití',             'HT', 'groups', 'C', ts(2026,6,24,19), '', '', 'scheduled'],
  [52, 'Brasil',         'BR', 'Escocia',           'GB-SCT', 'groups', 'C', ts(2026,6,24,19), '', '', 'scheduled'],
  [53, 'Sudáfrica',      'ZA', 'Corea del Sur',     'KR', 'groups', 'A', ts(2026,6,24,22), '', '', 'scheduled'],
  [54, 'Dinamarca',      'DK', 'México',            'MX', 'groups', 'A', ts(2026,6,24,22), '', '', 'scheduled'],
  // ──── 25 JUN ────
  [55, 'Curazao',        'CW', 'Costa de Marfil',   'CI', 'groups', 'E', ts(2026,6,25,17), '', '', 'scheduled'],
  [56, 'Ecuador',        'EC', 'Alemania',          'DE', 'groups', 'E', ts(2026,6,25,17), '', '', 'scheduled'],
  [57, 'Japón',          'JP', 'Ucrania',           'UA', 'groups', 'F', ts(2026,6,25,20), '', '', 'scheduled'],
  [58, 'Túnez',          'TN', 'Países Bajos',      'NL', 'groups', 'F', ts(2026,6,25,20), '', '', 'scheduled'],
  [59, 'Paraguay',       'PY', 'Australia',         'AU', 'groups', 'D', ts(2026,6,25,23), '', '', 'scheduled'],
  [60, 'Turquía',        'TR', 'Estados Unidos',    'US', 'groups', 'D', ts(2026,6,25,23), '', '', 'scheduled'],
  // ──── 26 JUN ────
  [61, 'Noruega',        'NO', 'Francia',           'FR', 'groups', 'I', ts(2026,6,26,16), '', '', 'scheduled'],
  [62, 'Senegal',        'SN', 'Irak',              'IQ', 'groups', 'I', ts(2026,6,26,16), '', '', 'scheduled'],
  [63, 'Cabo Verde',     'CV', 'Arabia Saudita',    'SA', 'groups', 'H', ts(2026,6,26,21), '', '', 'scheduled'],
  [64, 'Uruguay',        'UY', 'España',            'ES', 'groups', 'H', ts(2026,6,26,21), '', '', 'scheduled'],
  [65, 'Egipto',         'EG', 'Irán',              'IR', 'groups', 'G', ts(2026,6,27,0),  '', '', 'scheduled'],
  [66, 'Nueva Zelanda',  'NZ', 'Bélgica',          'BE', 'groups', 'G', ts(2026,6,27,0),  '', '', 'scheduled'],
  // ──── 27 JUN ────
  [67, 'Croacia',        'HR', 'Ghana',             'GH', 'groups', 'L', ts(2026,6,27,18), '', '', 'scheduled'],
  [68, 'Panamá',         'PA', 'Inglaterra',        'GB-ENG', 'groups', 'L', ts(2026,6,27,18), '', '', 'scheduled'],
  [69, 'Colombia',       'CO', 'Portugal',          'PT', 'groups', 'K', ts(2026,6,27,20,30), '', '', 'scheduled'],
  [70, 'Jamaica',        'JM', 'Uzbekistán',        'UZ', 'groups', 'K', ts(2026,6,27,20,30), '', '', 'scheduled'],
  [71, 'Argelia',        'DZ', 'Austria',           'AT', 'groups', 'J', ts(2026,6,27,23), '', '', 'scheduled'],
  [72, 'Jordania',       'JO', 'Argentina',         'AR', 'groups', 'J', ts(2026,6,27,23), '', '', 'scheduled'],
  // ──── ELIMINATORIAS: placeholders (sin equipos definidos aún) ─────────────
  [73,  'P73-A',  '', 'P73-B',  '', 'round_of_32',    null, ts(2026,6,28,0),  '', '', 'scheduled'],
  [74,  'P74-A',  '', 'P74-B',  '', 'round_of_32',    null, ts(2026,6,29,0),  '', '', 'scheduled'],
  [75,  'P75-A',  '', 'P75-B',  '', 'round_of_32',    null, ts(2026,6,29,19), '', '', 'scheduled'],
  [76,  'P76-A',  '', 'P76-B',  '', 'round_of_32',    null, ts(2026,6,29,19), '', '', 'scheduled'],
  [77,  'P77-A',  '', 'P77-B',  '', 'round_of_32',    null, ts(2026,6,30,0),  '', '', 'scheduled'],
  [78,  'P78-A',  '', 'P78-B',  '', 'round_of_32',    null, ts(2026,6,30,19), '', '', 'scheduled'],
  [79,  'P79-A',  '', 'P79-B',  '', 'round_of_32',    null, ts(2026,6,30,19), '', '', 'scheduled'],
  [80,  'P80-A',  '', 'P80-B',  '', 'round_of_32',    null, ts(2026,7,1,0),   '', '', 'scheduled'],
  [81,  'P81-A',  '', 'P81-B',  '', 'round_of_32',    null, ts(2026,7,1,19),  '', '', 'scheduled'],
  [82,  'P82-A',  '', 'P82-B',  '', 'round_of_32',    null, ts(2026,7,1,19),  '', '', 'scheduled'],
  [83,  'P83-A',  '', 'P83-B',  '', 'round_of_32',    null, ts(2026,7,2,0),   '', '', 'scheduled'],
  [84,  'P84-A',  '', 'P84-B',  '', 'round_of_32',    null, ts(2026,7,2,19),  '', '', 'scheduled'],
  [85,  'P85-A',  '', 'P85-B',  '', 'round_of_32',    null, ts(2026,7,2,19),  '', '', 'scheduled'],
  [86,  'P86-A',  '', 'P86-B',  '', 'round_of_32',    null, ts(2026,7,3,0),   '', '', 'scheduled'],
  [87,  'P87-A',  '', 'P87-B',  '', 'round_of_32',    null, ts(2026,7,3,19),  '', '', 'scheduled'],
  [88,  'P88-A',  '', 'P88-B',  '', 'round_of_32',    null, ts(2026,7,3,19),  '', '', 'scheduled'],
  [89,  'P89-A',  '', 'P89-B',  '', 'round_of_16',    null, ts(2026,7,4,0),   '', '', 'scheduled'],
  [90,  'P90-A',  '', 'P90-B',  '', 'round_of_16',    null, ts(2026,7,4,19),  '', '', 'scheduled'],
  [91,  'P91-A',  '', 'P91-B',  '', 'round_of_16',    null, ts(2026,7,5,0),   '', '', 'scheduled'],
  [92,  'P92-A',  '', 'P92-B',  '', 'round_of_16',    null, ts(2026,7,5,19),  '', '', 'scheduled'],
  [93,  'P93-A',  '', 'P93-B',  '', 'round_of_16',    null, ts(2026,7,6,0),   '', '', 'scheduled'],
  [94,  'P94-A',  '', 'P94-B',  '', 'round_of_16',    null, ts(2026,7,6,19),  '', '', 'scheduled'],
  [95,  'P95-A',  '', 'P95-B',  '', 'round_of_16',    null, ts(2026,7,7,0),   '', '', 'scheduled'],
  [96,  'P96-A',  '', 'P96-B',  '', 'round_of_16',    null, ts(2026,7,7,19),  '', '', 'scheduled'],
  [97,  'P97-A',  '', 'P97-B',  '', 'quarterfinals',  null, ts(2026,7,9,0),   '', '', 'scheduled'],
  [98,  'P98-A',  '', 'P98-B',  '', 'quarterfinals',  null, ts(2026,7,10,0),  '', '', 'scheduled'],
  [99,  'P99-A',  '', 'P99-B',  '', 'quarterfinals',  null, ts(2026,7,11,0),  '', '', 'scheduled'],
  [100, 'P100-A', '', 'P100-B', '', 'quarterfinals',  null, ts(2026,7,11,19), '', '', 'scheduled'],
  [101, 'P101-A', '', 'P101-B', '', 'semifinals',     null, ts(2026,7,14,0),  '', '', 'scheduled'],
  [102, 'P102-A', '', 'P102-B', '', 'semifinals',     null, ts(2026,7,15,0),  '', '', 'scheduled'],
  [103, 'P103-A', '', 'P103-B', '', 'third_place',    null, ts(2026,7,18,0),  '', '', 'scheduled'],
  [104, 'P104-A', '', 'P104-B', '', 'final',          null, ts(2026,7,19,0),  '', '', 'scheduled'],
];

const MATCHES_HEADER      = ['id','team_a','flag_a','team_b','flag_b','phase','group_name','match_date','real_score_a','real_score_b','status'];
const PREDICTIONS_HEADER  = ['email','match_id','score_a','score_b','timestamp'];
const RANKING_HEADER      = ['email','username','total_points','total_predictions','correct_predictions'];

async function ensureSheet(sheets, title) {
  const { data } = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const exists = data.sheets.some((s) => s.properties.title === title);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
    console.log(`✅ Hoja '${title}' creada.`);
  } else {
    console.log(`ℹ️  Hoja '${title}' ya existe.`);
  }
}

async function writeHeader(sheets, title, header) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${title}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [header] },
  });
  console.log(`✅ Encabezados de '${title}' escritos.`);
}

async function main() {
  if (!SHEET_ID)                               { console.error('❌ SHEET_ID no configurado'); process.exit(1); }
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) { console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON no configurado'); process.exit(1); }

  const sheets = await getSheetsClient();

  // Crear hojas
  await ensureSheet(sheets, 'matches');
  await ensureSheet(sheets, 'predictions');
  await ensureSheet(sheets, 'ranking');

  // Escribir encabezados
  await writeHeader(sheets, 'matches',     MATCHES_HEADER);
  await writeHeader(sheets, 'predictions', PREDICTIONS_HEADER);
  await writeHeader(sheets, 'ranking',     RANKING_HEADER);

  // Cargar partidos
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'matches!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: MATCHES },
  });
  console.log(`✅ ${MATCHES.length} partidos cargados en 'matches'.`);

  console.log('\n🎉 Google Sheet inicializado correctamente.');
  console.log('\n⚠️  PRÓXIMO PASO MANUAL:');
  console.log('  En la hoja "ranking", a partir de la fila 2, ingresar en:');
  console.log('  Col C: =SUMPRODUCT((predictions!A$2:A$5000=A2)*...) [ver GOOGLE_SHEETS_SETUP.md]');
  console.log('  Col D: =COUNTIF(predictions!A$2:A$5000, A2)');
  console.log('  Col E: [similar a C sin multiplicar x3]');
}

main().catch((err) => { console.error('❌', err.message); process.exit(1); });
