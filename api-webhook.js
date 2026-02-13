const express = require('express');
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET);

const handleEvent = (event) => {
  console.log('Received event:', event.type);

  switch (event.type) {
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      console.log(`PaymentIntent for ${failedPaymentIntent.amount} failed.`);
      console.log(event);
      break;
    case 'payment_intent.succeeded':
      
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

const setupWebhookRoutes = (app) => {
  app.get('/webhook', (req, res) => {
    res.send('Stripe webhook receiver');
  });

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    app.post('/webhook/payment-intent', express.raw({ type: 'application/json' }), (req, res) => {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      handleEvent(event);
      res.json({ received: true });
    });
  }
};

module.exports = { setupWebhookRoutes };
