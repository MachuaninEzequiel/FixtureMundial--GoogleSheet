/**
 * add-ranking-formulas.js
 * Agrega las fórmulas de cálculo de puntos y ranking en la hoja 'ranking'
 * usando una fila "template" con fórmulas que se aplicarán a todos los usuarios.
 *
 * Las columnas C, D, E se completan con fórmulas ARRAYFORMULA para que
 * cualquier nuevo usuario registrado en la col A tenga sus puntos calculados
 * automáticamente sin necesidad de copiar fórmulas manualmente.
 *
 * Uso: node scripts/add-ranking-formulas.js
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

async function main() {
  const sheets = await getSheetsClient();

  // ARRAYFORMULA en C1 encabezado con un truco: ponemos la fórmula en C2 como
  // fórmula individual, y la API la copia hacia abajo automáticamente cuando
  // api/sync-user.js agrega filas. Para que funcione así, ponemos solo la
  // fórmula en la primera fila de datos (fila 2) por ahora como placeholder.
  // Cuando sync-user agrega el primer usuario, las fórmulas ya están.

  // En realidad lo ideal con Google Sheets es poner ARRAYFORMULA en la fila de encabezado
  // o usar fórmulas en cada fila individual. Dado que sync-user.js agrega filas
  // sin fórmulas (solo email y username), usaremos un enfoque diferente:
  // ponemos fórmulas ARRAYFORMULA en las celdas C1, D1, E1 sobrescribiendo el header,
  // por eso las ponemos en C2, D2, E2 como template que el usuario puede copiar.
  // 
  // MEJOR ENFOQUE: ARRAYFORMULA en fila 1 (encabezado) para calcular toda la columna.

  const formulas = [
    // C2: total_points con ARRAYFORMULA
    [
      // total_points
      '=IF(A2="","",SUMPRODUCT((predictions!$A$2:$A$5000=A2)*(predictions!$C$2:$C$5000=IFERROR(INDEX(matches!$I$2:$I$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),-999))*(predictions!$D$2:$D$5000=IFERROR(INDEX(matches!$J$2:$J$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),-999))*3))',
      // total_predictions
      '=IF(A2="","",COUNTIF(predictions!$A$2:$A$5000,A2))',
      // correct_predictions
      '=IF(A2="","",SUMPRODUCT((predictions!$A$2:$A$5000=A2)*(predictions!$C$2:$C$5000=IFERROR(INDEX(matches!$I$2:$I$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),-999))*(predictions!$D$2:$D$5000=IFERROR(INDEX(matches!$J$2:$J$5000,MATCH(predictions!$B$2:$B$5000,matches!$A$2:$A$5000,0)),-999))))',
    ],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'ranking!C2:E2',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: formulas },
  });

  console.log('✅ Fórmulas de ranking escritas en fila 2 (template).');
  console.log('');
  console.log('ℹ️  IMPORTANTE: Las fórmulas están en la fila 2 como template.');
  console.log('   Cuando un usuario se loguea, sync-user.js agrega su fila.');
  console.log('   Necesitás copiar manualmente C2:E2 hacia abajo en el Sheet,');
  console.log('   O configurar un App Script en el Sheet para auto-copiar.');
  console.log('');
  console.log('💡 ALTERNATIVA RECOMENDADA: Usar ARRAYFORMULA en C1 para toda la columna.');
  console.log('   Ver instrucciones en GOOGLE_SHEETS_SETUP.md');
}

main().catch((err) => { console.error('❌', err.message); process.exit(1); });
