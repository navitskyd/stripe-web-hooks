const express = require('express');

const setupPromoRoutes = (app) => {
  app.get('/promo', (req, res) => {
    res.json({
      message: 'Promo endpoint',
      available_promos: [
        { code: 'SAVE10', discount: '10%' },
        { code: 'SAVE20', discount: '20%' }
      ]
    });
  });

  app.post('/promo/validate', express.json(), (req, res) => {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Promo code required' });
    }

    const promos = {
      'SAVE10': { valid: true, discount: '10%' },
      'SAVE20': { valid: true, discount: '20%' }
    };

    const promo = promos[code.toUpperCase()];

    if (promo) {
      res.json({ valid: true, code, discount: promo.discount });
    } else {
      res.status(404).json({ valid: false, code, message: 'Invalid promo code' });
    }
  });
};

module.exports = { setupPromoRoutes };
