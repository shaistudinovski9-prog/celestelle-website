const { CATALOG } = require('../data/celestelleCatalog');

describe('imported Celestelle catalog', () => {
  test('has the expected 12 products', () => {
    expect(CATALOG).toHaveLength(12);
  });

  test('slugs are unique and url-safe', () => {
    const slugs = CATALOG.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  test('prices are in dollars (not cents) and positive', () => {
    for (const p of CATALOG) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.price).toBeLessThan(1000);      // dollars, e.g. 89 — not 8900 cents
      expect(Number.isFinite(p.price)).toBe(true);
    }
  });

  test('every product has title, description, image, and stock', () => {
    for (const p of CATALOG) {
      expect(p.title).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.image_url).toMatch(/^\/images\/products\/.+\.(png|jpg)$/);
      expect(p.stock_qty).toBeGreaterThan(0);
      expect(p.active).toBe(true);
    }
  });

  test('does not include the funnel-only intro duplicate', () => {
    expect(CATALOG.find((p) => p.slug === 'ritual-serum')).toBeUndefined();
  });

  test('bundles carry a compare-at ("was") price above their sale price', () => {
    for (const slug of ['starter-ritual', 'complete-ritual']) {
      const p = CATALOG.find((x) => x.slug === slug);
      expect(p.compare_at_price).toBeGreaterThan(p.price);
    }
    // non-bundles have no compare price
    expect(CATALOG.find((p) => p.slug === 'vitamin-c-serum').compare_at_price).toBeUndefined();
  });
});
