// read-ugc-pulse-sorted.js
const {getRef} = require('./common');
const {sendEmail} = require("../src/utils/email");
const ref = getRef('ugc-pulse');

const today = new Date();

// парсер даты формата dd.MM.yyyy → Date
function parseDMY(dateStr) {
  if (!dateStr) {
    return null;
  }

  try {
    const [d, m, y] = dateStr.split('.').map((p) => parseInt(p, 10));
    if (!d || !m || !y) {
      return new Date(dateStr)
    }

    return new Date(y, m - 1, d);
  } catch (err) {
    console.warn('Failed to parse date:', dateStr, err);
    return new Date(dateStr)
  }
}

// разница в днях (today - lastPayment)
function calcDaysFrom(lastPaymentStr) {
  const d = parseDMY(lastPaymentStr);
  if (!d) {
    return 0;
  }

  const ms = today.getTime() - d.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)); // [web:77]
}

async function main() {
  try {
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


      updates[`${key}/daysLeft`] = newDaysLeft;

      let sent = value.sent || '';
      if (newDaysLeft < 4 && !sent) {
        console.warn(
            `⚠️ User ${key} has negative daysLeft (${newDaysLeft}). Consider checking their data.`);

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
        // console.log("[SKIPPED] Sending email to:", value.userID, "with body:", body);
       await sendEmail('Svethappy <svethappy3@gmail.com>', value.userID, 'UGC Pulse', body);
        updates[`${key}/sent`] = today;
        sent = today
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
      tariff: u.tariff || '',
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
