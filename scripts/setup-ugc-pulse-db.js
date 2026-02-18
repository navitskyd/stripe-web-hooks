// save as seed-ugc-pulse.js
// Run with: node seed-ugc-pulse.js

const crypto = require('crypto');

const { db, getRef } = require('./common');

const ref = getRef('ugc-pulse'); // или db.ref('ugc-pulse')

// 3) Подготовка данных
// Поля: userID, lastPaymentDate, tgId, tgNick, phone, firstName, lastName, tarif, daysPaid, daysLeft, sent
const usersTsv =`
userID\tlastPaymentDate\ttelegramID\ttelegramNickname\tphone\tfirstName\tlastName\ttariff\tdaysPaid\tdaysLeft\tsent
Diana Reels\t08.02.2026\t439528885\tiamdi_disha\t\tDiana\tDi\t\t999\t989\t
mamaeremi\t22.01.2026\t161316653\tmamaeremi\t\t@ulik_remi\t\t€0\t999\t972\t
salutverasalut\t22.01.2026\t236521006\tsalutverasalut\t\tВера Вино\t\t€0\t999\t972\t
svethappy_bot\t21.10.2025\t5061925573\tsvethappy_bot\t\tsvethappy\t\t\t999\t879\t
d074660\t21.10.2025\t553384344\td074660\t351962787079\tFirst name\tLast name\t\t999\t879\t
svethappy\t21.10.2025\t575148366\tsvethappy\t375293026158\tСвета\t\t\t999\t879\t
ekaterina visual\t19.10.2025\t165047167\tekaterinatymanovich\t\tЕкатерина Тыманович\thttps://instagram.com/ekaterina.tymanovich?igshid=YTQwZjQ0NmI0OA\t€0\t999\t877\t
nata ales\t19.10.2025\t8166627718\t\t351 910 706 639\tNatasha\tParedo\t€0\t999\t877\t
diarozenberg@gmail.com\t16.02.2026\t642246954\tDiana\t\tDiana\t\t€30\t30\t28\t
nadzeyalipskaya1987@gmail.com,pr.nadiacreates@gmail.com\t08.02.2026\t668654757\t\t\tНадежда\tТьеррадентро\t€15\t60\t50\t
losicka@ya.ru\t21.02.2026\t552848859\tLiberty_by\t\tVera\tLiberty\t€25\t30\t33\t
i.belenkevi4@gmail.com\t21.02.2026\t504837155\tnext_wife\t\tИрина\t\t€25\t30\t33\t
1642367m@gmail.com\t20.02.2026\t486994897\tmarkeltanya\t\tTanya\t\t\t30\t32\t
alexavt1975@mail.ru\t19.02.2026\t1280312334\tklik777\t\tТатьяна\t\t€15\t30\t31\t
msvitaminka89@gmail.com\t19.02.2026\t590763947\tAlena_Olive\t\tAlena\t\t€15\t30\t31\t
grigorovich_y.p.87@mail.ru\t19.02.2026\t730962752\tullia_la\t375 297 738 621\tЮлия\t\t€15\t30\t31\t
igorajena@gmail.com\t19.02.2026\t1329369104\tIrish88\t\tИрина Сергеевна\t\t€25\t30\t31\t
asiaholub@gmail.com,asiaholub@icloud.com\t19.02.2026\t761240769\tGolub_promarketing\t\tлегализация 🇵🇱/маркетинг 🌍 Ася\t\t\t30\t31\t
snezhana.trunina@gmail.com,snejjik@gmail.com\t05.02.2026\t1840041565\tsnezha_nezh\t\tСнежана\t\t€15\t30\t17\t
birzgalksu@gmail.com\t03.01.2026\t5451457589\tbirzgalK\t\tKsenya\tBirzgal\t€45\t60\t14\t
kasp-olga@ya.ru\t26.12.2025\t186038632\tkaspolga\t\tОльга\tКасперович\t€45\t60\t6\tкаждый месяц по 15 евро до сентября 2026
olgamednikova1990@mail.ru\t22.01.2026\t332790595\tolienka_mednikova\t\tOlga\tMednikova\t\t30\t3\t
olga.kursy.95@mail.ru\t22.01.2026\t408686752\tDolce_vita8\t\t!PC--sevi--CP!\t\t€15\t30\t3\t
katloverusakovich@gmail.com\t21.01.2026\t676557682\tkatrin_rsk\t375297551157\tЕкатерина Русакович\t\t€15\t30\t2\tsent
asia4@mail.ru\t21.01.2026\t368190915\tAlesia_Triboy\t\tAlesia\t\t€15\t30\t2\tsent
tatyanao.to@gmail.com\t21.01.2026\t301106061\tTatyana_ostr\t\tTatsiana\t\t\t30\t2\tsent
Lesnevskayak@gmail.com\t20.01.2026\t1017288279\tKatarzyna_WP\t\tЕкатерина\t\t€15\t30\t1\tsent
tatjana.bus@hotmail.com\t20.01.2026\t1666961665\tTatjana_Busmanova\t\tTatjana\tBušmanova\t€15\t30\t1\tsent
Maryia.hlushak@gmail.com\t20.01.2026\t309940406\tMaria_Glusak_Jurgens\t\tMaryia\tHlusak\t€15\t30\t1\tsent
1666916@gmail.com\t20.01.2026\t802865419\tAksana_R\t\tvideok5an4a\tОксана Рыжанкова 8(029) 384-04-94\t€15\t30\t1\tsent
alsu198826@gmail.com\t20.01.2026\t883496041\talsu_leonteva\t\tАлсу\tЛеонтьева\t€15\t30\t1\tsent
kavaleuskaya.nata@gmail.com\t20.01.2026\t264773617\tkavaleuskaya\t\tНаталья\t\t€15\t30\t1\tsent
nastya.vix@mail.ru\t20.01.2026\t733771172\tNastassii_s\t\tNastya👼🏻🤍\tАнастасия Кургей\t€15\t30\t1\tsent
moselka@yandex.ru\t19.01.2026\t816524249\t\t375293233382\tMarina\t\t\t30\t0\tsent
button0780@gmail.com\t19.01.2026\t405440402\tAnastasiyaLepeshko\t\tАнастасия\tЛепешко\t\t30\t0\tsent
viktoray92@gmail.com\t19.01.2026\t1064227128\t\t\tVika\t\t€15\t30\t0\tsent
kolosokvpole08@gmail.com\t19.01.2026\t1012522960\t\t\tКатерина\tКіс\t€15\t30\t0\tsent
`.trim()

// аккуратный парсер TSV
function parseTsv(tsv) {
  const lines = tsv.split('\n').filter((l) => l.trim().length > 0);
  const rawHeaders = lines[0].split('\t');

  const headers = rawHeaders.map((h, idx) => {
    let key = h.trim()
    .replace(/\s+/g, '')          // убираем пробелы
    .replace(/[^a-zA-Z0-9_]/g, ''); // только латиница/цифры/_
    if (!key) key = `col${idx}`;      // если ключ пустой → col0,col1,...
    return key;
  });

  const rows = lines.slice(1).map((line) => {
    const cols = line.split('\t');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ? cols[i].trim() : '';
    });
    return obj;
  });

  return rows;
}

const users = parseTsv(usersTsv);

// проверка: нет ли пустых ключей
for (const u of users) {
  for (const key of Object.keys(u)) {
    if (!key) {
      console.error('EMPTY KEY in object:', u);
    }
  }
}

// ключ для Firebase: SHA-256(userID)
function keyFromUserId(userID) {
  return crypto.createHash('sha256').update(userID || 'no-id', 'utf8').digest('hex');
}

const dataToWrite = {};
for (const u of users) {
  const key = keyFromUserId(u.userID);
  dataToWrite[key] = u;
}

ref
.set(dataToWrite)
.then(() => {
  console.log('✅ ugc-pulse seeded successfully');
  process.exit(0);
})
.catch((err) => {
  console.error('❌ Error writing ugc-pulse:', err);
  process.exit(1);
});