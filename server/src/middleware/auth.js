// Admin authentication — JWT bearer tokens (harvested from RBOS auth model,
// simplified to a single admin tier since there are no salon roles).
const jwt = require('jsonwebtoken');

const DEFAULT_EXPIRY = '12h';

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

// Pure, unit-testable given a secret via opts.secret (used by tests).
function signToken(payload, opts = {}) {
  const secret = opts.secret || getSecret();
  return jwt.sign(payload, secret, { expiresIn: opts.expiresIn || DEFAULT_EXPIRY });
}

function verifyToken(token, opts = {}) {
  const secret = opts.secret || getSecret();
  return jwt.verify(token, secret);
}

// Express middleware — requires a valid admin bearer token.
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });
  try {
    const decoded = verifyToken(token);
    if (decoded.kind !== 'admin') return res.status(403).json({ error: 'forbidden' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

module.exports = { signToken, verifyToken, requireAdmin, DEFAULT_EXPIRY };
