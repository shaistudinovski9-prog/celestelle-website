// Pure display helpers for order statuses (labels + badge classes).

export const FULFILLMENT_STEPS = ['unfulfilled', 'packed', 'shipped', 'delivered'];

export function nextFulfillment(status) {
  const i = FULFILLMENT_STEPS.indexOf(status);
  if (i < 0 || i >= FULFILLMENT_STEPS.length - 1) return null;
  return FULFILLMENT_STEPS[i + 1];
}

export function label(status) {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function badgeClass(status) {
  switch (status) {
    case 'paid':
    case 'delivered': return 'badge badge-green';
    case 'shipped': return 'badge badge-blue';
    case 'packed': return 'badge badge-amber';
    case 'pending':
    case 'unfulfilled': return 'badge badge-gray';
    case 'refunded':
    case 'cancelled': return 'badge badge-red';
    default: return 'badge badge-gray';
  }
}
