// Server entrypoint: boot schema, then listen. In production the built client
// (client/dist) is served statically alongside the API.
require('dotenv').config();
const path = require('path');
const express = require('express');
const { createApp } = require('./app');
const db = require('./db');
const { applyPatches } = require('./patches');

const PORT = process.env.PORT || 4000;

async function boot() {
  try {
    await db.runMigrations();
    await applyPatches();
    console.log('  ✓ schema ready');
  } catch (err) {
    console.error('Schema boot failed:', err.message);
    // Fail loud in production — a half-migrated DB should not silently serve.
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }

  const app = createApp();

  // Serve the built storefront in production.
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), err => err && next());
  });

  app.listen(PORT, () => console.log(`Celestelle server listening on :${PORT}`));
}

boot();
