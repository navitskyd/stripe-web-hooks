const express = require('express');
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const stripe = Stripe(process.env.STRIPE_SECRET);

const handleEvent = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      await processCheckoutSession(event.data.object);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

async function processCheckoutSession(session) {
  try {
    // Получаем email покупателя
    let customerEmail = session.customer_details?.email || session.customer_email || null;
    if(!customerEmail ) {
      console.error(`Error retrieving customer ${session.customer}:`, err && err.message ? err.message : err);
      return
    }
    customerEmail = customerEmail.toLowerCase();

    // Получаем product_ids из line_items (может быть несколько продуктов)
    let productIds = [];
    if (session.id) {
      // Получаем все line_items для сессии
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      if (lineItems.data && lineItems.data.length > 0) {
        productIds = lineItems.data
          .map(item => item.price && item.price.product)
          .filter(Boolean);
      }
    }

    for (const productId of productIds) {
      console.log('Product ' + productId + ' purchased by ' + customerEmail);
      // Попытка загрузить и вызвать обработчик продукта
      if (productId) {
        try {
          const handlerPath = path.join(__dirname, '..', 'products', `${productId}.js`);
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
    }

    return { productIds, customerEmail };
  } catch (err) {
    console.error('Error in processCheckoutSession:', err && err.message ? err.message : err);
    throw err;
  }
}

const setupWebhookRoutes = (app) => {
  app.get('/webhook', (req, res) => {
    res.send('Stripe webhook receiver');
  });

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    app.post('/webhook/checkout', express.raw({ type: 'application/json' }), async (req, res) => {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      console.log(webhookSecret)

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
  } else {
    app.post('/webhook/checkout', express.raw({ type: 'application/json' }), async (req, res) => {
      console.warn('STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification is disabled.');
      console.log(req.body)
    });
  }


};

module.exports = { setupWebhookRoutes };
