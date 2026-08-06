// Admin auth routes: POST /login, GET /me.
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'email_and_password_required' });

  const { rows } = await db.query(
    'SELECT id, email, name, password_hash, active FROM admin_users WHERE email = $1',
    [email]
  );
  const admin = rows[0];
  // Constant-ish response: same error whether the user is missing or the password is wrong.
  if (!admin || !admin.active || !(await bcrypt.compare(password, admin.password_hash))) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const token = signToken({ kind: 'admin', id: admin.id, email: admin.email });
  res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
});

router.get('/me', requireAdmin, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, email, name FROM admin_users WHERE id = $1',
    [req.admin.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json({ admin: rows[0] });
});

module.exports = router;
