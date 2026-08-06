// Express app factory — separated from the listener so tests can import it
// without opening a port.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());

  // Stripe webhook needs the RAW body for signature verification — register it
  // BEFORE express.json() so the JSON parser doesn't consume/alter the payload.
  const checkout = require('./routes/checkout');
  app.post('/api/checkout/webhook', express.raw({ type: 'application/json' }), checkout.webhookHandler);

  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'celestelle-store' }));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/settings', require('./routes/settings'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/checkout', checkout.router);
  app.use('/api/admin/orders', require('./routes/adminOrders'));

  return app;
}

module.exports = { createApp };
