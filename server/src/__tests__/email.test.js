const { buildOrderConfirmationEmail, buildShipmentEmail } = require('../lib/email');

const order = {
  order_number: 'CEL-00007', subtotal: 60, tax: 5.25, shipping: 0, total: 65.25,
};
const items = [
  { qty: 2, title: 'Glow Serum', line_total: 48 },
  { qty: 1, title: 'Body Oil — 30ml', line_total: 12 },
];

describe('buildOrderConfirmationEmail', () => {
  const { subject, text, html } = buildOrderConfirmationEmail(order, items);

  test('subject names the store and order', () => {
    expect(subject).toBe('Celestelle — order CEL-00007 confirmed');
  });
  test('text lists items and totals with free shipping', () => {
    expect(text).toContain('2 × Glow Serum');
    expect(text).toContain('Total: $65.25');
    expect(text).toContain('Shipping: Free');
  });
  test('shows tax only when > 0', () => {
    const noTax = buildOrderConfirmationEmail({ ...order, tax: 0 }, items).text;
    expect(noTax).not.toContain('Tax:');
  });
  test('html includes the order number', () => {
    expect(html).toContain('CEL-00007');
  });
});

describe('buildShipmentEmail', () => {
  test('includes tracking when provided', () => {
    const { subject, text, html } = buildShipmentEmail(order,
      { tracking_number: '1Z999', tracking_url: 'http://track/1' });
    expect(subject).toBe('Celestelle — order CEL-00007 has shipped');
    expect(text).toContain('Tracking: 1Z999');
    expect(html).toContain('track it');
  });
  test('omits tracking line when absent', () => {
    const { text } = buildShipmentEmail(order, {});
    expect(text).not.toContain('Tracking:');
  });
});
