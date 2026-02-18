
// firebase.js
const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sendEmail } = require('./email');

// Инициализация Firebase Admin
if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();

function getRef(pathInDb) {
  return db.ref(pathInDb);
}
function keyFromUserId(userID) {
  return crypto.createHash('sha256').update(userID || 'no-id', 'utf8').digest('hex');
}

module.exports = {
  admin,
  db,
  getRef,
  sendEmail, keyFromUserId
};
