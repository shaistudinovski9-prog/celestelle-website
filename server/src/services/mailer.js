// Provider-agnostic email sender. Default = no-op (logs only), so the app runs
// with zero email config and nothing in the order path breaks. When RESEND_API_KEY
// is set it sends via Resend's HTTP API (no SDK dependency — plain fetch).
//
// Swapping providers = editing only sendEmail(); the callers/builders don't change.
const settingsCache = require('../settingsCache');
const { buildOrderConfirmationEmail, buildShipmentEmail } = require('../lib/email');

function isConfigured() {
  return !!process.env.RESEND_API_KEY;
}

function fromAddress() {
  return process.env.MAIL_FROM || 'Celestelle <onboarding@resend.dev>';
}

// Low-level send. Never throws — returns a status object so callers can log.
async function sendEmail({ to, subject, text, html }) {
  if (!to) return { skipped: true, reason: 'no_recipient' };
  if (!isConfigured()) {
    console.log(`[mailer] (no provider configured) would send "${subject}" to ${to}`);
    return { skipped: true, reason: 'unconfigured' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromAddress(), to, subject, text, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[mailer] send failed ${res.status}: ${body}`);
      // Surface the provider's own message (e.g. Resend names the one address it
      // will deliver to) so the admin test can show it verbatim.
      let message = body;
      try { message = JSON.parse(body).message || body; } catch { /* keep raw */ }
      return { sent: false, status: res.status, error: (message || '').slice(0, 400) };
    }
    return { sent: true };
  } catch (err) {
    console.error('[mailer] send error:', err.message);
    return { sent: false, error: err.message };
  }
}

async function storeName() {
  return (await settingsCache.get('store_name', 'Celestelle')) || 'Celestelle';
}

// High-level, fire-and-forget helpers. They resolve a status and never reject.
async function sendOrderConfirmation({ order, items }) {
  if (!order?.customer_email) return { skipped: true, reason: 'no_email' };
  const name = await storeName();
  const { subject, text, html } = buildOrderConfirmationEmail(order, items, name);
  return sendEmail({ to: order.customer_email, subject, text, html });
}

async function sendShipmentNotice({ order, tracking }) {
  if (!order?.customer_email) return { skipped: true, reason: 'no_email' };
  const name = await storeName();
  const { subject, text, html } = buildShipmentEmail(order, tracking || {}, name);
  return sendEmail({ to: order.customer_email, subject, text, html });
}

module.exports = { isConfigured, sendEmail, sendOrderConfirmation, sendShipmentNotice };
