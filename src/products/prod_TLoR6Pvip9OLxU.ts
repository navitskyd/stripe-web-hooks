import crypto from "crypto";
import * as path from 'path';
import * as admin from 'firebase-admin';
import { sendEmail } from '../utils/email';

if (!admin.apps.length) {
  let firebaseserviceaccount = process.env.FIREBASE_SERVICE_ACCOUNT || '';
  console.log(firebaseserviceaccount)
  admin.initializeApp({
    credential: admin.credential.cert(firebaseserviceaccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.database();

/**
 * Удобный хелпер для получения ссылки на любой путь
 * @param {string} pathInDb
 */
function getRef(pathInDb:string) {
  return db.ref(pathInDb);
}

function keyFromUserId(userID:string) {
  return crypto.createHash('sha256').update(userID || 'no-id', 'utf8').digest('hex');
}

export const handleProduct = async (productId: string, customerEmail: string) => {

// UGC Pulse
  console.log("Клуб создателей контента - дополнительный месяц " + customerEmail);

  const ugcPulseChatId = -1002906638589;
  const ugcPulseId = -1002913124875;
  let id = keyFromUserId(customerEmail);
  const ref = getRef('ugc-pulse/' + id);
  const snap = await ref.child('daysPaid').once('value'); // или ref.once('value') и потом snap.val().daysPaid
  const daysPaid = snap.val() || 0;

  let date = new Date();
  const dataToWrite = {
      userID:customerEmail,
      lastPaymentDate: date.toISOString(),
      daysPaid: daysPaid + 30
  }

  ref
  .set(dataToWrite)
  .then(() => {
    console.log('✅ ugc-pulse seeded successfully '+date);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error writing ugc-pulse:', err);
    process.exit(1);
  });


  const body = `
    Дополнительный месяц подписки в клуб «UGC Pulse» оплачен!
    
    По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
`
  await sendEmail('Svethappy <svethappy3@gmail.com>', customerEmail, 'UGC Pulse', body);


};
