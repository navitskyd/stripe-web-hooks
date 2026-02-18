// prod_TLoPLmbyPJkGOK.js
const {getRef,sendEmail} = require('../../src/utils/common');
const { keyFromUserId } = require('../../src/utils/utils');
const {parseDMY, calcDaysFrom} = require("../utils/utils");

async function handleProduct(productId, customerEmail) {
  console.log('Клуб создателей контента - дополнительный месяц ' + customerEmail);

  const ugcPulseChatId = -1002906638589; // сейчас не используется, оставлено для совместимости
  const ugcPulseId = -1002913124875;     // сейчас не используется, оставлено для совместимости

  const id = keyFromUserId(customerEmail);
  const ref = getRef('ugc-pulse/' + id);

  // читаем текущее daysPaid
  const date = new Date();
  const snapshot = await ref.once('value');
  const userData = snapshot.val();
  const daysPaid = Number(userData.daysPaid) || 0;
  const lastPaymentDate = parseDMY(userData.lastPaymentDate);
  let daysFrom = calcDaysFrom(lastPaymentDate );
  console.log("Extra month purchase. Current daysPaid:", daysPaid, "lastPaymentDate:", lastPaymentDate, "daysFrom:", daysFrom);

  userData.lastPaymentDate = date.toISOString();
  userData.daysPaid = daysFrom<1 ? daysPaid + 30  : 30; // если с момента последнего платежа прошло меньше дня, то просто добавляем 30 дней, иначе перезаписываем на 30 дней
  userData.sent = '';

  await ref.set(userData)
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
