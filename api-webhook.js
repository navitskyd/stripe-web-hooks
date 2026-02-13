const express = require('express');
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const stripe = Stripe(process.env.STRIPE_SECRET);

const handleEvent = async (event) => {
  console.log('Received event:', event.type);

  switch (event.type) {
    case 'payment_intent.payment_failed': {
      const failedPaymentIntent = event.data.object;
      const email = failedPaymentIntent.last_payment_error && failedPaymentIntent.last_payment_error.payment_method && failedPaymentIntent.last_payment_error.payment_method.billing_details && failedPaymentIntent.last_payment_error.payment_method.billing_details.email;
      if (email && email !== 'dnavitski@gmail.com') {
        console.log("NOT processing failed payment intent for email:", email);
        return;
      }
      try {
        const samplePath = path.join(__dirname, 'payload', 'payment.success.json');
        const raw = fs.readFileSync(samplePath, 'utf8');
        const sample = JSON.parse(raw);
        const samplePi = sample && sample.object ? sample.object : sample;
        await processPayment(samplePi);
      } catch (err) {
        console.error('Error processing sample payment payload:', err && err.message ? err.message : err);
      }
      break;
    }
    case 'payment_intent.succeeded': {
      await processPayment(event.data.object);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

async function processPayment(paymentIntentPartial) {
  console.log('Processing payment for', paymentIntentPartial.id, 'with amount', paymentIntentPartial.amount);

  const pmId = paymentIntentPartial.payment_method ;
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(pmId, {
      expand: ['billing_details']
    });

    // determine productId solely from payment_details.order_reference
    let productId = null;
    if (paymentIntentPartial.payment_details && paymentIntentPartial.payment_details.order_reference) {
      productId = paymentIntentPartial.payment_details.order_reference;
    }

    // determine customer email
    let customerEmail = null;
    if (paymentMethod.billing_details && paymentMethod.billing_details.email) {
      customerEmail = paymentMethod.billing_details.email;
    }

    console.log('Product '+productId+' purchased by '+customerEmail);
    return { productId, customerEmail };
  } catch (err) {
    console.error('Error in processPayment:', err && err.message ? err.message : err);
    throw err;
  }
}

const setupWebhookRoutes = (app) => {
  app.get('/webhook', (req, res) => {
    res.send('Stripe webhook receiver');
  });

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    app.post('/webhook/payment-intent', express.raw({ type: 'application/json' }), async (req, res) => {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        await handleEvent(event);
        res.json({ received: true });
      } catch (err) {
        console.error('Error handling event:', err && err.message ? err.message : err);
        res.status(500).send('Error handling event');
      }
    });
  }
};

module.exports = { setupWebhookRoutes };
