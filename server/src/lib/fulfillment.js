// Pure fulfillment state logic — no DB. The admin order route calls these.

// Ordered lifecycle. Index order matters: forward-only transitions.
const STATES = ['unfulfilled', 'packed', 'shipped', 'delivered'];

function isValidState(s) {
  return STATES.includes(s);
}

// The next step in the lifecycle (for a one-click "advance" button), or null at the end.
function nextState(current) {
  const i = STATES.indexOf(current);
  if (i < 0 || i >= STATES.length - 1) return null;
  return STATES[i + 1];
}

// Allow staying put or moving forward; disallow unknown states and moving backward
// (a shipped order shouldn't silently revert to unfulfilled).
function canTransition(from, to) {
  if (!isValidState(to)) return false;
  const fi = STATES.indexOf(from);
  const ti = STATES.indexOf(to);
  if (fi < 0) return ti >= 0;      // unknown/empty current → any valid target
  return ti >= fi;
}

// Validate + normalize a fulfillment update.
// Returns { errors, value }. Tracking is optional but recommended for 'shipped'.
function validateFulfillInput(body = {}, currentStatus = 'unfulfilled') {
  const errors = [];
  const value = {};

  const status = String(body.status || '').trim();
  if (!isValidState(status)) errors.push('invalid_status');
  else if (!canTransition(currentStatus, status)) errors.push('illegal_transition');
  else value.status = status;

  if (body.tracking_number !== undefined) value.tracking_number = String(body.tracking_number || '').trim() || null;
  if (body.tracking_url !== undefined) value.tracking_url = String(body.tracking_url || '').trim() || null;

  return { errors, value };
}

module.exports = { STATES, isValidState, nextState, canTransition, validateFulfillInput };
