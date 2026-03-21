const { google } = require('googleapis');

/**
 * Returns an authenticated Google Sheets client.
 * Credentials are loaded from the GOOGLE_SERVICE_ACCOUNT_JSON env var
 * (the full JSON content of the service account key file, minified).
 */
function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

const SHEET_ID = process.env.SHEET_ID;

module.exports = { getSheetsClient };
