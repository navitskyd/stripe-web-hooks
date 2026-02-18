// read-ugc-pulse-sorted.js
const {getRef,sendEmail} = require('../src/utils/common');
const {extractNumber,calcDaysFrom,keyFromUserId} = require('../src/utils/utils');
const ref = getRef('ugc-pulse');


const db=`
Diana Reels\t08.02.2026\t439528885\tiamdi_disha\t\tDiana\tDi
mamaeremi\t22.01.2026\t161316653\tmamaeremi\t\t@ulik_remi\t
salutverasalut\t22.01.2026\t236521006\tsalutverasalut\t\tВера Вино\t
svethappy_bot\t21.10.2025\t5061925573\tsvethappy_bot\t\tsvethappy\t
d074660\t21.10.2025\t553384344\td074660\t351962787079\tFirst name\tLast name
svethappy\t21.10.2025\t575148366\tsvethappy\t375293026158\tСвета\t
ekaterina visual\t19.10.2025\t165047167\tekaterinatymanovich\t\tЕкатерина Тыманович\thttps://instagram.com/ekaterina.tymanovich?igshid=YTQwZjQ0NmI0OA
nata ales\t19.10.2025\t8166627718\t\t351 910 706 639\tNatasha\tParedo
diarozenberg@gmail.com\t16.02.2026\t642246954\tDiana\t\tDiana\t
nadzeyalipskaya1987@gmail.com,pr.nadiacreates@gmail.com\t08.02.2026\t668654757\t\t\tНадежда\tТьеррадентро
losicka@ya.ru\t21.02.2026\t552848859\tLiberty_by\t\tVera\tLiberty
i.belenkevi4@gmail.com\t21.02.2026\t504837155\tnext_wife\t\tИрина\t
1642367m@gmail.com\t20.02.2026\t486994897\tmarkeltanya\t\tTanya\t
alexavt1975@mail.ru\t19.02.2026\t1280312334\tklik777\t\tТатьяна\t
msvitaminka89@gmail.com\t19.02.2026\t590763947\tAlena_Olive\t\tAlena\t
grigorovich_y.p.87@mail.ru\t19.02.2026\t730962752\tullia_la\t375 297 738 621\tЮлия\t
igorajena@gmail.com\t19.02.2026\t1329369104\tIrish88\t\tИрина Сергеевна\t
asiaholub@gmail.com,asiaholub@icloud.com\t19.02.2026\t761240769\tGolub_promarketing\t\tлегализация 🇵🇱/маркетинг 🌍 Ася\t
snezhana.trunina@gmail.com,snejjik@gmail.com\t05.02.2026\t1840041565\tsnezha_nezh\t\tСнежана\t
birzgalksu@gmail.com\t03.01.2026\t5451457589\tbirzgalK\t\tKsenya\tBirzgal
kasp-olga@ya.ru\t26.12.2025\t186038632\tkaspolga\t\tОльга\tКасперович
olgamednikova1990@mail.ru\t22.01.2026\t332790595\tolienka_mednikova\t\tOlga\tMednikova
olga.kursy.95@mail.ru\t22.01.2026\t408686752\tDolce_vita8\t\t!PC--sevi--CP!\t
katloverusakovich@gmail.com\t21.01.2026\t676557682\tkatrin_rsk\t375297551157\tЕкатерина Русакович\t
asia4@mail.ru\t21.01.2026\t368190915\tAlesia_Triboy\t\tAlesia\t
tatyanao.to@gmail.com\t21.01.2026\t301106061\tTatyana_ostr\t\tTatsiana\t
Lesnevskayak@gmail.com\t20.01.2026\t1017288279\tKatarzyna_WP\t\tЕкатерина\t
tatjana.bus@hotmail.com\t20.01.2026\t1666961665\tTatjana_Busmanova\t\tTatjana\tBušmanova
Maryia.hlushak@gmail.com\t20.01.2026\t309940406\tMaria_Glusak_Jurgens\t\tMaryia\tHlusak
1666916@gmail.com\t20.01.2026\t802865419\tAksana_R\t\tvideok5an4a\tОксана Рыжанкова 8(029) 384-04-94
alsu198826@gmail.com\t20.01.2026\t883496041\talsu_leonteva\t\tАлсу\tЛеонтьева
kavaleuskaya.nata@gmail.com\t20.01.2026\t264773617\tkavaleuskaya\t\tНаталья\t
nastya.vix@mail.ru\t20.01.2026\t733771172\tNastassii_s\t\tNastya👼🏻🤍\tАнастасия Кургей
moselka@yandex.ru\t19.01.2026\t816524249\t\t375293233382\tMarina\t
button0780@gmail.com\t19.01.2026\t405440402\tAnastasiyaLepeshko\t\tАнастасия\tЛепешко
viktoray92@gmail.com\t19.01.2026\t1064227128\t\t\tVika\t
kolosokvpole08@gmail.com\t19.01.2026\t1012522960\t\t\tКатерина\tКіс
`

function getRawDB(){
  const lines = db.trim().split('\n');
  const result = lines.reduce((acc, line) => {
    const [userID, lastPaymentDate, telegramID, telegramNickname,phone,firstName,lastName] = line.split('\t');
    const key = keyFromUserId(userID);
    acc[key] = { userID, telegramID ,telegramNickname,phone,firstName,lastName};
    return acc;
  }, {});

  return result;
}

async function main() {
   const dbRaw = getRawDB()
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

      // const toFill = 'telegramNickname'
      // if(dbRaw[key] && dbRaw[key][toFill]!==value[toFill]) {
      //    console.warn(`⚠️ ${toFill} mismatch for user ${key}. DB has ${dbRaw[key][toFill]}, but ugc-pulse has ${value[toFill]}. Consider checking their data.`);
      //    updates[`${key}/${toFill}`]=dbRaw[key][toFill];
      // }

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
      userID: u.userID || '',
      lastPaymentDate: u.lastPaymentDate || '',
      telegramID: u.telegramID ||  '',
      telegramNickname: u.telegramNickname  || '',
     // phone: u.phone || '',
     //  firstName: u.firstName || '',
     //  lastName: u.lastName || '',
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
