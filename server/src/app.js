// Express app factory — separated from the listener so tests can import it
// without opening a port.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'celestelle-store' }));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/settings', require('./routes/settings'));

  return app;
}

module.exports = { createApp };
