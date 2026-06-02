/**
 * update-ranking-formulas.js — migración one-shot
 *
 * Reescribe las columnas C/D/E de TODAS las filas existentes de la hoja
 * `ranking` para que usen la nueva escala de puntos (5/4/2/0).
 *
 * Cuándo correrlo: una sola vez, después de mergear los cambios del
 * sistema de puntos. Los usuarios nuevos toman las fórmulas correctas
 * automáticamente desde `api/sync-user.js`.
 *
 * Uso: node scripts/update-ranking-formulas.js
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

function rankingFormulas(rowNum) {
  return [
    `=IF(A${rowNum}="","",SUMPRODUCT(LET(pa,predictions!$C$2:$C$5000,pb,predictions!$D$2:$D$5000,ra,IFERROR(INDEX(matches!$I$2:$I$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),""),rb,IFERROR(INDEX(matches!$J$2:$J$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),""),fin,ISNUMBER(ra)*ISNUMBER(rb),usr,(predictions!$A$2:$A$5000=A${rowNum})*1,exact,IFERROR((pa=ra)*(pb=rb),0),sameDiff,IFERROR(((pa-pb)=(ra-rb))*1,0),sameWin,IFERROR((SIGN(pa-pb)=SIGN(ra-rb))*1,0),usr*fin*(exact+2*sameDiff+2*sameWin))))`,
    `=IF(A${rowNum}="","",COUNTIF(predictions!$A$2:$A$5000,A${rowNum}))`,
    `=IF(A${rowNum}="","",SUMPRODUCT(LET(pa,predictions!$C$2:$C$5000,pb,predictions!$D$2:$D$5000,ra,IFERROR(INDEX(matches!$I$2:$I$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),""),rb,IFERROR(INDEX(matches!$J$2:$J$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),""),fin,ISNUMBER(ra)*ISNUMBER(rb),usr,(predictions!$A$2:$A$5000=A${rowNum})*1,usr*fin*IFERROR((pa=ra)*(pb=rb),0))))`,
  ];
}

async function main() {
  if (!SHEET_ID) { console.error('❌ SHEET_ID no configurado'); process.exit(1); }
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON no configurado'); process.exit(1);
  }

  const sheets = await getSheetsClient();

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'ranking!A2:A',
  });

  const rows = data.values || [];
  const userRows = rows
    .map((row, idx) => ({ email: row[0], rowNum: idx + 2 }))
    .filter((r) => r.email);

  if (userRows.length === 0) {
    console.log('ℹ️  No hay usuarios en la hoja ranking. Nada que actualizar.');
    return;
  }

  console.log(`📝 Actualizando fórmulas para ${userRows.length} usuario(s)...`);

  // batchUpdate por eficiencia
  const data_to_update = userRows.map((r) => ({
    range: `ranking!C${r.rowNum}:E${r.rowNum}`,
    values: [rankingFormulas(r.rowNum)],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: data_to_update,
    },
  });

  console.log(`✅ Listo. ${userRows.length} fila(s) reescrita(s) con escala 5/4/2/0.`);
}

main().catch((err) => { console.error('❌', err.message); process.exit(1); });
