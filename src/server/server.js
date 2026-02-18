require('dotenv').config();
const express = require('express');
const { setupWebhookRoutes } = require('./api-webhook');
const { setupPromoRoutes } = require('./api-promo');
const { setupTravelRoutes } = require('./api-travel');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Root endpoint
app.get('/', (req, res) => {
  try {
    const buildInfoPath = path.join(__dirname, 'build-info.json');
    if (fs.existsSync(buildInfoPath)) {
      const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
      res.json(buildInfo);
    } else {
      res.status(404).json({ error: 'Build info not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read build info', details: err.message });
  }
});

// Mount route handlers
setupWebhookRoutes(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
setupPromoRoutes(app);
setupTravelRoutes(app);


app.listen(port, () => console.log(`Listening on port ${port}`));
