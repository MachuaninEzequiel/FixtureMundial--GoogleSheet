const http = require('http');
const fetchMatches = require('./api/matches.js');

const req = { method: 'GET', headers: {} };
const res = {
  setHeader: (k, v) => console.log(`Set header: ${k} = ${v}`),
  status: (code) => ({
    json: (data) => console.log(`Status ${code}, JSON length:`, data.length || JSON.stringify(data)),
    end: () => console.log(`Status ${code}, end`)
  }),
  json: (data) => console.log(`JSON length:`, data.length || JSON.stringify(data)),
};

async function test() {
  require('dotenv').config();
  console.log("SHEET_ID:", process.env.SHEET_ID);
  try {
    await fetchMatches(req, res);
  } catch (e) {
    console.error(e);
  }
}
test();
