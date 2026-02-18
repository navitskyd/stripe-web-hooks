// prod_TLoPLmbyPJkGOK.js
const crypto = require('crypto');
const admin = require('firebase-admin');
const { sendEmail } = require('../utils/email');

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

/**
 * Удобный хелпер для получения ссылки на любой путь
 */
function getRef(pathInDb) {
  return db.ref(pathInDb);
}

function keyFromUserId(userID) {
  return crypto.createHash('sha256').update(userID || 'no-id', 'utf8').digest('hex');
}

async function handleProduct(productId, customerEmail) {
  console.log('Клуб создателей контента - дополнительный месяц ' + customerEmail);

  const ugcPulseChatId = -1002906638589; // сейчас не используется, оставлено для совместимости
  const ugcPulseId = -1002913124875;     // сейчас не используется, оставлено для совместимости

  const id = keyFromUserId(customerEmail);
  const ref = getRef('ugc-pulse/' + id);

  // читаем текущее daysPaid
  const snap = await ref.child('daysPaid').once('value');
  const daysPaid = Number(snap.val()) || 0;

  const date = new Date();
  const dataToWrite = {
    userID: customerEmail,
    lastPaymentDate: date.toISOString(),
    daysPaid: daysPaid + 30,
  };

  await ref.set(dataToWrite)
  .then(() => {
    console.log('✅ ugc-pulse seeded successfully ' + date.toISOString());
  })
  .catch((err) => {
    console.error('❌ Error writing ugc-pulse:', err);
    throw err;
  });

  const body = `
    Дополнительный месяц подписки в клуб «UGC Pulse» оплачен!
    
    По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
`;

  await sendEmail('Svethappy <svethappy3@gmail.com>', customerEmail, 'UGC Pulse', body);
}

module.exports = {
  handleProduct,
};
