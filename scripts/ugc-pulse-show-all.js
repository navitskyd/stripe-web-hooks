// read-ugc-pulse-sorted.js
const {getRef} = require('../src/utils/common');
const {calcDaysFrom,buildKey} = require('../src/utils/utils');
const ref = getRef('ugc-pulse');

async function main() {

    try {
        const snap = await ref.once('value');
        const data = snap.val() || {};

        // 1) посчитаем новые daysLeft и соберём апдейты
        const updates = {};
        const listRaw = [];

        for (const [key, value] of Object.entries(data)) {
            const lastPaymentDate = value.lastPaymentDate || '';
            const originalDaysPaid = Number(value.daysPaid || 0);
            const daysPassed = calcDaysFrom(lastPaymentDate);
            const newDaysLeft = originalDaysPaid - daysPassed;

            let sent = value.sent || '';
            if (newDaysLeft < 4 && !sent) {
                console.warn(
                    `⚠️ User ${key} has negative daysLeft (${newDaysLeft}). Consider checking their data.`);
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

        // 3) сортируем по обновлённому daysLeft
        listRaw.sort((a, b) => {
            const da = Number(a.daysLeft) || 0;
            const dbb = Number(b.daysLeft) || 0;
            return dbb - da;
        });


// 4) готовим данные для табличного вывода
        const list = listRaw.map((u, idx) => ({
            key: u.key,
            userID: u.userID || '',
            lastPaymentDate: u.lastPaymentDate || '',
            telegramID: u.telegramID || '',
            // telegramNickname: u.telegramNickname  || '',
            // phone: u.phone || '',
            //  firstName: u.firstName || '',
            //  lastName: u.lastName || '',
            daysLeft: u.daysLeft || 0,
            daysPaid: u.dayspaid || u.daysPaid || '',
            tariff: '€' + u.tariff,
            sent: u.sent || '',
            notes: u.notes || '',
        }));

        console.table(list);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();
