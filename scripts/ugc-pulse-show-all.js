// read-ugc-pulse-sorted.js
const {getRef,sendEmail} = require('../src/utils/common');
const {extractNumber,calcDaysFrom} = require('../src/utils/utils');
const ref = getRef('ugc-pulse');



async function main() {
  try {
    const today = new Date();
    const snap = await ref.once('value');
    const data = snap.val() || {};

    // 1) посчитаем новые daysLeft и соберём апдейты
    const updates = {};
    const listRaw = [];

    for (const [key, value] of Object.entries(data)) {
      const lastPaymentDate = value.lastPaymentDate  || '';

      // у тебя в данных daysLeft = оплаченные дни - прошедшие
      const originalDaysPaid = Number( value.daysPaid || 0);
      const daysPassed = calcDaysFrom(lastPaymentDate);

      const newDaysLeft = originalDaysPaid - daysPassed;
      let tariff = extractNumber(value.tariff) || 15; // по умолчанию 15 евро, если не указано

      updates[`${key}/daysLeft`] = newDaysLeft;
      updates[`${key}/tariff`] = tariff;

      let sent = value.sent || '';
      if (newDaysLeft < 4 && !sent) {
        console.warn(
            `⚠️ User ${key} has negative daysLeft (${newDaysLeft}). Consider checking their data.`);

        if(tariff===0 || tariff===15) {
          const body = `
          Здравствуйте!
          
          Ваша подписка на UGC Club от Svethappy истекла или скоро истекает!
          
          Для вас последний звонок - возможность оплаты по цене 15 EUR!
          Ссылка действует 24 часа.
          
          https://buy.stripe.com/7sY6oI2vr2TKbdwgw78og05?locale=ru
          
          Спасибо!
          С Уважением,
          Команда Svethappy
`;
          await sendEmail('Svethappy <svethappy3@gmail.com>', value.userID, 'UGC Pulse', body);
          updates[`${key}/sent`] = today;
          sent = today
        } else if (tariff===30){
          const body = `
          Здравствуйте!
          
          Ваша подписка на UGC Club от Svethappy истекла или скоро истекает!
          
          Чтобы продлить доступ к клубу, оплатите по ссылке ниже.
          Если вы оформляете второй месяц за €15, то все последующие месяцы до сентября 2026 года вы также получаете по цене €15 в месяц.
          
          https://buy.stripe.com/fZueVeda51PG95o93F8og00?locale=ru
          
          Спасибо!
          С Уважением,
          Команда Svethappy
`;
          await sendEmail('Svethappy <svethappy3@gmail.com>', value.userID, 'UGC Pulse', body);
          updates[`${key}/sent`] = today;
          sent = today
        } else {
          console.warn(`Unknown tariff ${tariff} for user ${key}, skipping email.`);
        }

      }

      listRaw.push({
        key,
        ...value,
        lastPaymentDate,
        daysLeft: newDaysLeft,
        daysPaid: originalDaysPaid,
        sent: sent
      });
    }

    // 2) обновляем daysLeft в db
    await ref.update(updates); // патч только поля daysLeft [web:80]

    // 3) сортируем по обновлённому daysLeft
    listRaw.sort((a, b) => {
      const da = Number(a.daysLeft) || 0;
      const dbb = Number(b.daysLeft) || 0;
      return dbb - da;
    });

    // listRaw.sort((a, b) => {
    //   const da = Number(a.tariff) || 0;
    //   const dbb = Number(b.tariff) || 0;
    //   return dbb - da;
    // });

// 4) готовим данные для табличного вывода
    const list = listRaw.map((u, idx) => ({
      key: u.key,
      userID: u.userID || u.userId || '',
      //firstName: u.Firstname || u.firstName || u['First name'] || '',
      //lastName: u.lastname || '',
      lastPaymentDate: u.lastPaymentDate || '',
      telegramID: u.telegramID || u.TGID || '',
      telegramNickname: u.telegramNickname || u.tg_nick || '',
      daysLeft: u.daysLeft || 0,
      daysPaid: u.dayspaid || u.daysPaid || '',
      tariff: '€'+u.tariff,
      sent: u.sent || '',
    }));

    console.table(list);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
