require('dotenv').config();
const express = require('express');
const { setupWebhookRoutes } = require('./api-webhook');
const { setupPromoRoutes } = require('./api-promo');

const app = express();
const port = process.env.PORT || 3000;

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Stripe webhook & promo server' });
});

// Mount route handlers
setupWebhookRoutes(app);
setupPromoRoutes(app);

app.listen(port, () => console.log(`Listening on port ${port}`));
