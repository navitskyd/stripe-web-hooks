
const {sendEmail} = require('../utils/common');
const cors = require('cors');

const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET);
const couponId = 'qSm8E9pd'; // ID купона, который нужно использовать для всех промокодов

const setupPromoRoutes = (app) => {

  app.options('/promo', cors({origin: '*', methods: ['POST']})); // preflight

  app.post(
      '/promo',
      cors({
        origin: '*', // или ['https://твойдомен', 'http://localhost:3000']
        methods: ['POST'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }),
      async (req, res) => {

        const {email} = req.body || {};
        if (!email) {
          return res.status(400).json({error: 'Email is required'});
        }
        try {
          let found = false;
          let starting_after = undefined;
          do {
            const params = {coupon: couponId, limit: 100};
            if (starting_after) {
              params.starting_after = starting_after;
            }
            const promoCodes = await stripe.promotionCodes.list(params);
            for (const promo of promoCodes.data) {
              if (promo.metadata && promo.metadata.email
                  && promo.metadata.email.toLowerCase()
                  === email.toLowerCase()) {
                found = true;
                break;
              }
            }
            if (found) {
              break;
            }
            starting_after = promoCodes.data.length
                ? promoCodes.data[promoCodes.data.length - 1].id : undefined;
          } while (starting_after);
          if (found) {
            //console.log(process.env.STRIPE_SECRET);
            return res.status(409).json({message: 'Already exists'});
          }
        
          const expiresAt = Math.floor(Date.now() / 1000) + 26 * 60 * 60; // 24 hours from now

          const newPromo = await stripe.promotionCodes.create({
            coupon: couponId,
            metadata: {email},
            max_redemptions: 2,
            expires_at: expiresAt,
          });

          const body = `Здравствуйте!

Вас приветствует команда SvetHappy!

Ваш промокод <b>[PROMO]</b> для получения скидки 15% на все материалы по путешествиям.

Все актуальные предложения вы можете найти по ссылке:
https://svetahappy.web.app/travel/

Промокод действителен 24 часа с момента получения.

По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>`

          await sendEmail('Школа «Путешествуй сам» <svethappy3@gmail.com>',
              email,
              'Промокод от Svethappy',
              body.replace('[PROMO]', newPromo.code));

          return res.status(201).json({email, code: newPromo.code});
        } catch (err) {
          console.error('Stripe error:', err);
          return res.status(500).json({error: 'Internal server error'});
        }
      });

  // Endpoint to check for expiring promo codes (within 3 hours) and send reminder emails
  app.get('/promo-check', async (req, res) => {
    try {
      const now = Math.floor(Date.now() / 1000);
      const threeHoursFromNow = now + 3 * 60 * 60;
      
      const expiringPromos = [];
      let starting_after = undefined;
      
      // Fetch all promotion codes and filter those expiring within 3 hours
      do {
        const params = { limit: 100, active: true,coupon: couponId };
        if (starting_after) {
          params.starting_after = starting_after;
        }
        
        const promoCodes = await stripe.promotionCodes.list(params);
        
        for (const promo of promoCodes.data) {
          // Check if promo code expires within 3 hours and reminder not already sent
          if (promo.expires_at && promo.expires_at > now && promo.expires_at <= threeHoursFromNow) {
            const email = promo.metadata?.email;
            const reminderSent = promo.metadata?.reminder;
            if (email && !reminderSent) {
              expiringPromos.push({
                id: promo.id,
                code: promo.code,
                email: email,
                expires_at: promo.expires_at
              });
            }
          }
        }
        
        starting_after = promoCodes.data.length
            ? promoCodes.data[promoCodes.data.length - 1].id : undefined;
      } while (starting_after);
      
      // Send reminder emails to customers with expiring promo codes
      const emailResults = [];
      for (const promo of expiringPromos) {
        const hoursLeft = Math.round((promo.expires_at - now) / 3600 * 10) / 10;
        
        const body = `Здравствуйте!

Напоминаем, что ваш промокод <b>${promo.code}</b> для получения скидки 15% истекает менее чем через 2 часа.

Не упустите возможность воспользоваться скидкой!

Все актуальные предложения вы можете найти по ссылке:
https://svetahappy.web.app/travel/

По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>`;

        try {
          await sendEmail(
            'Школа «Путешествуй сам» <svethappy3@gmail.com>',
            promo.email,
            //'dnavitski@gmail.com',
            `Напоминание: ваш промокод скоро истекает!`,
            body
          );
          
          // Mark promo code with reminder date to avoid duplicate emails
          const currentDate = new Date().toISOString();
          await stripe.promotionCodes.update(promo.id, {
            metadata: { email: promo.email, reminder: currentDate }
          });
          
          emailResults.push({ email: promo.email, code: promo.code, status: 'sent' });
        } catch (emailErr) {
          console.error(`Failed to send reminder to ${promo.email}:`, emailErr);
          emailResults.push({ email: promo.email, code: promo.code, status: 'failed', error: emailErr.message });
        }
      }
      
      return res.status(200).json({
        checked: expiringPromos.length,
        results: emailResults
      });
    } catch (err) {
      console.error('Promo check error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};

module.exports = {setupPromoRoutes};
