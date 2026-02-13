require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Stripe webhook receiver'));

const handleEvent = (event) => {
  console.log('Received event:', event.type);
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      break;
    case 'invoice.payment_failed':
      console.log('Invoice payment failed:', event.data.object.id);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }
};

if (process.env.STRIPE_WEBHOOK_SECRET) {
  app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
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
} else {
  // Insecure / local mode: parse JSON and skip signature verification
  app.post('/webhook', express.json(), (req, res) => {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    const event = req.body;
    handleEvent(event);
    res.json({ received: true });
  });
}

app.listen(port, () => console.log(`Listening on ${port}`));
