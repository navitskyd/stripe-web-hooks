
// firebase.js
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let app;

// инициализируем только один раз
if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
} else {
  app = admin.app();
}

const db = admin.database();

/**
 * Удобный хелпер для получения ссылки на любой путь
 * @param {string} pathInDb
 */
function getRef(pathInDb) {
  return db.ref(pathInDb);
}

module.exports = {
  admin,
  db,
  getRef,
};
