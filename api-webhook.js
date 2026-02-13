const express = require('express');
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const stripe = Stripe(process.env.STRIPE_SECRET);

const handleEvent = async (event) => {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      await processPayment(event.data.object);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

async function processPayment(paymentIntent) {
  const pmId = paymentIntent.payment_method ;
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(pmId, {
      expand: ['billing_details']
    });

    // determine productId solely from payment_details.order_reference
    let productId = null;
    if (paymentIntent.payment_details && paymentIntent.payment_details.order_reference) {
      productId = paymentIntent.payment_details.order_reference;
    }

    // determine customer email
    let customerEmail = null;
    if (paymentMethod.billing_details && paymentMethod.billing_details.email) {
      customerEmail = paymentMethod.billing_details.email;
    }

    console.log('Product '+productId+' purchased by '+customerEmail);

    // Attempt to load and invoke product-specific handler
    if (productId) {
      try {
        const handlerPath = path.join(__dirname, 'src', 'products', `${productId}.ts`);
        if (fs.existsSync(handlerPath)) {
          const handler = require(handlerPath);
          if (handler.handleProduct && typeof handler.handleProduct === 'function') {
            await handler.handleProduct(productId, customerEmail);
          }
        } else {
          console.log(`No handler found for product ${productId}`);
        }
      } catch (err) {
        console.error(`Error loading/calling product handler for ${productId}:`, err && err.message ? err.message : err);
      }
    }

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
