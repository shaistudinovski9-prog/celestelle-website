// Pure email body builders — no network. Return { subject, text, html }.
// Kept dead simple and inline-styled so any provider can send them as-is.

function money(n, currency = 'USD') {
  const v = Number(n || 0);
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v); }
  catch { return `$${v.toFixed(2)}`; }
}

function itemsText(items = []) {
  return items.map((i) => `  ${i.qty} × ${i.title} — ${money(i.line_total)}`).join('\n');
}

function itemsHtml(items = []) {
  return items.map((i) =>
    `<tr><td style="padding:4px 0">${i.qty} × ${i.title}</td>` +
    `<td style="padding:4px 0;text-align:right">${money(i.line_total)}</td></tr>`
  ).join('');
}

function buildOrderConfirmationEmail(order, items = [], storeName = 'Celestelle') {
  const subject = `${storeName} — order ${order.order_number} confirmed`;
  const text =
    `Thank you for your order!\n\n` +
    `Order ${order.order_number}\n\n` +
    `${itemsText(items)}\n\n` +
    `Subtotal: ${money(order.subtotal)}\n` +
    (Number(order.tax) > 0 ? `Tax: ${money(order.tax)}\n` : '') +
    `Shipping: ${Number(order.shipping) === 0 ? 'Free' : money(order.shipping)}\n` +
    `Total: ${money(order.total)}\n\n` +
    `We’ll email you again when it ships.\n— ${storeName}`;
  const html =
    `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">` +
    `<h2>Thank you for your order!</h2>` +
    `<p>Order <strong>${order.order_number}</strong> is confirmed.</p>` +
    `<table style="width:100%;border-collapse:collapse">${itemsHtml(items)}` +
    `<tr><td style="padding-top:10px">Subtotal</td><td style="padding-top:10px;text-align:right">${money(order.subtotal)}</td></tr>` +
    (Number(order.tax) > 0 ? `<tr><td>Tax</td><td style="text-align:right">${money(order.tax)}</td></tr>` : '') +
    `<tr><td>Shipping</td><td style="text-align:right">${Number(order.shipping) === 0 ? 'Free' : money(order.shipping)}</td></tr>` +
    `<tr><td style="font-weight:700;padding-top:6px">Total</td><td style="font-weight:700;text-align:right;padding-top:6px">${money(order.total)}</td></tr>` +
    `</table><p style="color:#666">We’ll email you again when it ships.</p><p>— ${storeName}</p></div>`;
  return { subject, text, html };
}

function buildShipmentEmail(order, { tracking_number, tracking_url } = {}, storeName = 'Celestelle') {
  const subject = `${storeName} — order ${order.order_number} has shipped`;
  const trackLineText = tracking_number
    ? `Tracking: ${tracking_number}${tracking_url ? ` (${tracking_url})` : ''}\n` : '';
  const text =
    `Good news — your order ${order.order_number} is on its way!\n\n` +
    trackLineText + `\n— ${storeName}`;
  const trackLineHtml = tracking_number
    ? `<p>Tracking: <strong>${tracking_number}</strong>${tracking_url ? ` — <a href="${tracking_url}">track it</a>` : ''}</p>` : '';
  const html =
    `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">` +
    `<h2>Your order is on its way! 📦</h2>` +
    `<p>Order <strong>${order.order_number}</strong> has shipped.</p>` +
    trackLineHtml + `<p>— ${storeName}</p></div>`;
  return { subject, text, html };
}

module.exports = { buildOrderConfirmationEmail, buildShipmentEmail };
