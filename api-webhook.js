const express = require('express');
const Stripe = require('stripe');

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
      await processPayment(failedPaymentIntent);
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

  const piId = paymentIntentPartial.id || paymentIntentPartial;
  try {
    const pi = await stripe.paymentIntents.retrieve(piId, {
      expand: ['customer', 'charges.data.invoice.lines.data.price.product']
    });

    // determine productId
    let productId = null;
    if (pi.payment_details && pi.payment_details.order_reference) {
      productId = pi.payment_details.order_reference;
    }

    if (!productId && pi.charges && pi.charges.data && pi.charges.data.length) {
      const charge = pi.charges.data[0];
      const invoice = charge.invoice;
      if (invoice && invoice.lines && invoice.lines.data && invoice.lines.data.length) {
        const line = invoice.lines.data[0];
        const price = line.price;
        if (price) {
          productId = typeof price.product === 'string' ? price.product : (price.product && price.product.id);
        }
      }
    }

    if (!productId && pi.metadata && pi.metadata.product_id) {
      productId = pi.metadata.product_id;
    }

    // determine customer email
    let customerEmail = null;
    if (pi.customer) {
      if (typeof pi.customer === 'string') {
        const cust = await stripe.customers.retrieve(pi.customer);
        customerEmail = cust && cust.email;
      } else if (pi.customer.email) {
        customerEmail = pi.customer.email;
      }
    }

    if (!customerEmail && pi.charges && pi.charges.data && pi.charges.data.length) {
      const charge = pi.charges.data[0];
      if (charge.billing_details && charge.billing_details.email) {
        customerEmail = charge.billing_details.email;
      }
    }

    console.log('Payment details:', { paymentIntent: pi.id, productId, customerEmail });
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
