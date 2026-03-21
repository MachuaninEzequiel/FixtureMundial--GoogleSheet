require('dotenv').config();
const { SHEET_ID } = require('./api/_lib/sheets');
console.log("From sheets.js:", SHEET_ID);
console.log("From process.env:", process.env.SHEET_ID);
