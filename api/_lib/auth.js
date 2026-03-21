const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only once (Vercel may reuse function instances)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Verifies the Firebase ID Token from the Authorization header.
 * Returns the decoded token (includes uid, email, name, etc.)
 * Throws if the token is missing or invalid.
 */
async function verifyToken(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) throw new Error('No Authorization token provided');
  return admin.auth().verifyIdToken(token);
}

module.exports = { verifyToken };
