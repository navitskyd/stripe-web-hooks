// prod_TLoPLmbyPJkGOK.js
const {getRef,sendEmail,keyFromUserId,cr} = require('../../src/utils/common');

async function handleProduct(productId, customerEmail) {
  console.log('Клуб создателей контента - дополнительный месяц ' + customerEmail);

  const ugcPulseChatId = -1002906638589; // сейчас не используется, оставлено для совместимости
  const ugcPulseId = -1002913124875;     // сейчас не используется, оставлено для совместимости

  const id = keyFromUserId(customerEmail);
  const ref = getRef('ugc-pulse/' + id);

  // читаем текущее daysPaid

  const snapshot = await ref.once('value');
  const userData = snapshot.val();
  const daysPaid = Number(userData.daysPaid) || 0;

  const date = new Date();
  const dataToWrite = {
    userID: customerEmail,
    lastPaymentDate: date.toISOString(),
    daysPaid: daysPaid + 30,
    tariff: userData.tariff,
    sent: ''
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
