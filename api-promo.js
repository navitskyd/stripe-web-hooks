

const express = require('express');
const { sendEmail } = require('./dist/utils/email');

const Stripe = require('stripe');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


const setupPromoRoutes = (app) => {
  app.get('/promo', (req, res) => {
    // ...existing code...
  });

  app.post('/promo', async (req, res) => {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    try {
      // List all promo codes for coupon 'qSm8E9pd' and check metadata.email
      let found = false;
      let starting_after = undefined;
      do {
        const params = { coupon: 'qSm8E9pd', limit: 100 };
        if (starting_after) params.starting_after = starting_after;
        const promoCodes = await stripe.promotionCodes.list(params);
        for (const promo of promoCodes.data) {
          if (promo.metadata && promo.metadata.email && promo.metadata.email.toLowerCase() === email.toLowerCase()) {
            found = true;
            break;
          }
        }
        if (found) break;
        starting_after = promoCodes.data.length ? promoCodes.data[promoCodes.data.length - 1].id : undefined;
      } while (starting_after);
      if (found) {
        return res.status(409).json({ message: 'Already exists' });
      }
      // Not found, create a new promo code (or just return 201 for demo)

      const couponId = 'qSm8E9pd';
      const expiresAt = Math.floor(Date.now() / 1000) + 26 * 60 * 60; // 24 hours from now

      const newPromo = await stripe.promotionCodes.create({
        coupon: couponId,
        metadata: { email },
        max_redemptions: 2,
        expires_at: expiresAt,
      });

      const body = `Здравствуйте!

Вас приветствует команда SvetHappy!

Ваш промокод <b>[PROMO]</b> для получения скидки 15% на все материалы по путешествиям.
Промокод действителен 24 часа с момента получения.

По техническим вопросам можно писать на email <a href="mailto:svethappy3@gmail.com">svethappy3@gmail.com</a>`

    
          await sendEmail('Школа «Путешествуй сам» <svethappy3@gmail.com>',
              email,
              'Промокод от Svethappy',
              body.replace('[PROMO]', newPromo.code));

      return res.status(201).json({ email, code: newPromo.code });
    } catch (err) {
      console.error('Stripe error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};


module.exports = { setupPromoRoutes };
