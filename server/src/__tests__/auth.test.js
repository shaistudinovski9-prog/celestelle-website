const { signToken, verifyToken, requireAdmin } = require('../middleware/auth');

const SECRET = 'test-secret-please-ignore';

describe('auth token helpers', () => {
  test('signs and verifies a round-trip payload', () => {
    const token = signToken({ kind: 'admin', id: 1, email: 'a@b.com' }, { secret: SECRET });
    const decoded = verifyToken(token, { secret: SECRET });
    expect(decoded.kind).toBe('admin');
    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('a@b.com');
  });

  test('rejects a token signed with a different secret', () => {
    const token = signToken({ kind: 'admin', id: 1 }, { secret: SECRET });
    expect(() => verifyToken(token, { secret: 'wrong-secret' })).toThrow();
  });
});

describe('requireAdmin middleware', () => {
  const run = (headers) => {
    const req = { headers };
    let statusCode = 200;
    let body = null;
    let nextCalled = false;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { body = b; return this; },
    };
    requireAdmin(req, res, () => { nextCalled = true; });
    return { statusCode, body, nextCalled, req };
  };

  test('401 when no token is present', () => {
    const { statusCode, body, nextCalled } = run({});
    expect(statusCode).toBe(401);
    expect(body.error).toBe('missing_token');
    expect(nextCalled).toBe(false);
  });

  test('passes and sets req.admin for a valid admin token', () => {
    process.env.JWT_SECRET = SECRET;
    const token = signToken({ kind: 'admin', id: 7, email: 'owner@celestelle.com' });
    const { nextCalled, req } = run({ authorization: `Bearer ${token}` });
    expect(nextCalled).toBe(true);
    expect(req.admin.id).toBe(7);
    delete process.env.JWT_SECRET;
  });

  test('403 when the token is not an admin token', () => {
    process.env.JWT_SECRET = SECRET;
    const token = signToken({ kind: 'customer', id: 1 });
    const { statusCode, body } = run({ authorization: `Bearer ${token}` });
    expect(statusCode).toBe(403);
    expect(body.error).toBe('forbidden');
    delete process.env.JWT_SECRET;
  });
});
