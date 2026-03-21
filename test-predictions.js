require('dotenv').config();
const fetchPredictions = require('./api/predictions.js');

const req = {
  method: 'GET',
  headers: {
    authorization: 'Bearer FAKE_TOKEN'
  }
};
const res = {
  setHeader: (k, v) => {},
  status: (code) => {
    console.log("Status:", code);
    return {
      json: (data) => console.log(data),
      end: () => console.log("end")
    };
  },
  json: (data) => console.log("Data size:", data.length)
};

// Mock the verifyToken
const authLib = require('./api/_lib/auth.js');
authLib.verifyToken = async () => ({ email: 'test@example.com' });

async function test() {
  await fetchPredictions(req, res);
}
test();
