require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Stripe webhook receiver'));

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

  console.log('Received event:', event.type);

  // Basic example handling
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

  res.json({ received: true });
});

app.listen(port, () => console.log(`Listening on ${port}`));
