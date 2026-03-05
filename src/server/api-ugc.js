const {getRef, sendEmail} = require('../utils/common');
const {extractNumber, calcDaysFrom} = require('../utils/utils');

const ugcPulseChatId = -1002906638589;
const ugcPulseId = -1002913124875;

async function banUser(groupId, userId) {
  const botToken = process.env.TGBOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/banChatMember?chat_id=${groupId}&user_id=${userId}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`banChatMember: group=${groupId} user=${userId} result=`, data);
  } catch (e) {
    console.error(`Error removing user ${userId} from group ${groupId}:`, e);
  }
}

const setupUgcRoutes = (app) => {

  app.get('/ugc/check', async (req, res) => {
    const ref = getRef('ugc-pulse');
    
    try {
      const today = new Date();
      const snap = await ref.once('value');
      const data = snap.val() || {};

      const updates = {};
      const results = {
        processed: 0,
        emailsSent: [],
        usersBanned: [],
        errors: []
      };

      for (const [key, value] of Object.entries(data)) {
        const lastPaymentDate = value.lastPaymentDate || '';
        const originalDaysPaid = Number(value.daysPaid || 0);
        const daysPassed = calcDaysFrom(lastPaymentDate);
        const newDaysLeft = originalDaysPaid - daysPassed;
        let tariff = extractNumber(value.tariff) || 15;

        updates[`${key}/daysLeft`] = newDaysLeft;
        updates[`${key}/tariff`] = tariff;

        let sent = value.sent || '';
        
        // Send reminder email if daysLeft < 4 and not already sent
        if (newDaysLeft < 4 && !sent) {
          console.warn(`⚠️ User ${key} has low daysLeft (${newDaysLeft}). Sending reminder.`);

          try {
            if (tariff === 0 || tariff === 15) {
              const body = `
          Здравствуйте!
          
          Ваша подписка на UGC Club от Svethappy истекла или скоро истекает!
          
          Для вас возможность оплаты по цене 15 EUR!
          Предложение действует только до окончания вашей текущей подписки.
          
          https://buy.stripe.com/7sY6oI2vr2TKbdwgw78og05?locale=ru
          
          Спасибо!
          С Уважением,
          Команда Svethappy
`;
              await sendEmail('Svethappy <svethappy3@gmail.com>', value.userID, 'UGC Pulse', body);
              updates[`${key}/sent`] = today;
              sent = today;
              results.emailsSent.push({userID: value.userID, tariff, type: 'reminder'});
            } else if (tariff === 30) {
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
              sent = today;
              results.emailsSent.push({userID: value.userID, tariff, type: 'reminder'});
            } else {
              console.warn(`Unknown tariff ${tariff} for user ${key}, skipping email.`);
            }
          } catch (emailErr) {
            console.error(`Failed to send email to ${value.userID}:`, emailErr);
            results.errors.push({userID: value.userID, error: emailErr.message});
          }
        }

        // Ban user if daysLeft < 0 and not already deleted
        const deleted = 'Deleted';
        if (newDaysLeft < 0 && sent !== deleted) {
          console.warn(`Deleting User ${value.userID}`);
          
          try {
            await banUser(ugcPulseChatId, value.telegramID);
            await banUser(ugcPulseId, value.telegramID);
            updates[`${key}/sent`] = deleted;
            
            const body = `
        Ваша подписка в клуб «UGC Pulse» закончилась!
        
        Для возобновления просим писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>
        `;
            await sendEmail('Svethappy <svethappy3@gmail.com>', value.userID, 'UGC Pulse', body);
            results.usersBanned.push({userID: value.userID, telegramID: value.telegramID});
          } catch (banErr) {
            console.error(`Failed to ban user ${value.userID}:`, banErr);
            results.errors.push({userID: value.userID, error: banErr.message});
          }
        }

        results.processed++;
      }

      // Update database
      await ref.update(updates);

      return res.status(200).json(results);
    } catch (err) {
      console.error('UGC check error:', err);
      return res.status(500).json({error: 'Internal server error', details: err.message});
    }
  });
};

module.exports = {setupUgcRoutes};
