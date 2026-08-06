// Celestelle catalog — imported from the existing celestellebeauty.com site
// (Lovable app, src/data/products.js). Prices converted from cents → dollars.
// The funnel-only intro "ritual-serum" (a duplicate of the Vitamin C serum) is
// intentionally omitted. Seeded once into the DB by patches.js (guarded flag).
const DEFAULT_STOCK = 100;

const CATALOG = [
  {
    slug: 'starter-ritual', title: 'The Radiance Set', price: 179.00, compare_at_price: 207.00,
    image_url: '/images/products/starter-ritual.png',
    description: 'A complete 3-step Celestelle routine for brighter, healthier-looking skin. Cleanse, treat, and nourish with our most-loved Vitamin C line — bundled to save $28. Includes Vitamin C Cleanser, Vitamin C Serum, and Vitamin C Day Cream.',
    how_to_use: 'Cleanse, apply serum, then moisturizer. Morning and night.',
    ingredients: 'See individual products for full ingredient lists.',
  },
  {
    slug: 'complete-ritual', title: 'The Complete Set', price: 279.00, compare_at_price: 336.00,
    image_url: '/images/products/complete-ritual.png',
    description: 'Everything in the Radiance Set plus our Detoxifying Mud Mask for a weekly reset. The complete routine, bundled to save $57. Includes Vitamin C Cleanser, Serum, Day Cream, and Detoxifying Mud Mask.',
    how_to_use: 'Cleanse, serum, moisturizer daily. Use the mud mask 1–2× per week.',
    ingredients: 'See individual products for full ingredient lists.',
  },
  {
    slug: 'vitamin-c-serum', title: 'Vitamin C Brightening Serum', price: 89.00,
    image_url: '/images/products/vitamin-c-serum.png',
    description: 'A lightweight, fast-absorbing serum that targets dullness and uneven tone for a visibly brighter complexion.',
    how_to_use: 'Apply 3–4 drops to clean skin morning and night before moisturizer.',
    ingredients: 'Aqua, Sodium Ascorbyl Phosphate (Vitamin C), Glycerin, Hyaluronic Acid, Ferulic Acid, Vitamin E.',
  },
  {
    slug: 'vitamin-c-cleanser', title: 'Vitamin C Cleanser', price: 49.00,
    image_url: '/images/products/vitamin-c-cleanser.png',
    description: 'A creamy gel cleanser that removes impurities and makeup without stripping, leaving skin soft and luminous.',
    how_to_use: 'Massage onto damp skin, rinse with warm water. Morning and night.',
    ingredients: 'Aqua, Coco-Glucoside, Glycerin, Sodium Ascorbyl Phosphate (Vitamin C), Aloe Barbadensis.',
  },
  {
    slug: 'vitamin-c-day-cream', title: 'Vitamin C Day Cream', price: 69.00,
    image_url: '/images/products/vitamin-c-day-cream.png',
    description: 'A nourishing day cream that locks in hydration and supports a radiant, even-looking complexion.',
    how_to_use: 'Apply to face and neck each morning after serum.',
    ingredients: 'Aqua, Glycerin, Caprylic/Capric Triglyceride, Sodium Ascorbyl Phosphate, Niacinamide, Shea Butter.',
  },
  {
    slug: 'vitamin-c-peeling-gel', title: 'Vitamin C Peeling Gel', price: 69.00,
    image_url: '/images/products/vitamin-c-peeling-gel.png',
    description: 'A gentle peeling gel that sweeps away dead skin and reveals a smoother, brighter surface — no harsh scrubbing.',
    how_to_use: 'Massage onto dry skin until it lifts, rinse. Use 2× per week.',
    ingredients: 'Aqua, Carbomer, Cellulose, Sodium Ascorbyl Phosphate, Centella Asiatica Extract.',
  },
  {
    slug: '24k-gold-serum', title: '24K Gold Serum', price: 99.00,
    image_url: '/images/products/24k-gold-serum.png',
    description: 'Infused with 24K gold and peptides to firm, smooth, and impart a luminous golden glow.',
    how_to_use: 'Apply 2–3 drops to clean skin morning and night.',
    ingredients: 'Aqua, Glycerin, Gold (24K), Palmitoyl Tripeptide-1, Hyaluronic Acid, Vitamin E.',
  },
  {
    slug: '24k-eye-serum', title: 'Rejuvenating 24K Eye Serum', price: 89.00,
    image_url: '/images/products/24k-eye-serum.png',
    description: 'A targeted eye serum with 24K gold and caffeine to de-puff, brighten, and smooth the look of fine lines.',
    how_to_use: 'Dab gently around the eye area morning and night.',
    ingredients: 'Aqua, Caffeine, Gold (24K), Hyaluronic Acid, Peptides, Niacinamide.',
  },
  {
    slug: 'black-truffle-collagen-essence', title: 'Black Truffle Collagen Essence', price: 189.00,
    image_url: '/images/products/black-truffle-collagen-essence.png',
    description: 'A rich, replenishing essence with black truffle extract and collagen to restore bounce and deep hydration.',
    how_to_use: 'Pat a few drops into skin after cleansing, before serum.',
    ingredients: 'Aqua, Tuber Melanosporum (Black Truffle) Extract, Hydrolyzed Collagen, Sodium Hyaluronate, Squalane.',
  },
  {
    slug: 'black-truffle-spf30', title: 'Black Truffle Double Defense SPF30', price: 189.00,
    image_url: '/images/products/black-truffle-spf30.png',
    description: 'A weightless SPF30 day shield with black truffle antioxidants — protects against UV and environmental stress without a white cast.',
    how_to_use: 'Apply as the last step of your morning routine. Reapply as needed.',
    ingredients: 'Aqua, Zinc Oxide, Tuber Melanosporum Extract, Niacinamide, Vitamin E, Squalane.',
  },
  {
    slug: 'dark-spot-corrector', title: 'Dark Spot Corrector', price: 189.00,
    image_url: '/images/products/dark-spot-corrector.jpg',
    description: 'A concentrated treatment that targets stubborn dark spots and post-blemish marks for a more even tone over time.',
    how_to_use: 'Apply to spots morning and night. Always follow with SPF.',
    ingredients: 'Aqua, Niacinamide, Alpha-Arbutin, Tranexamic Acid, Licorice Root Extract, Vitamin C.',
  },
  {
    slug: 'detoxifying-mud-mask', title: 'Detoxifying Mud Mask', price: 119.00,
    image_url: '/images/products/detoxifying-mud-mask.jpg',
    description: 'A purifying clay mask that draws out impurities and refines the look of pores for a fresh, clarified complexion.',
    how_to_use: 'Apply an even layer, leave 10 minutes, rinse. Use 1–2× per week.',
    ingredients: 'Kaolin, Bentonite, Aqua, Charcoal Powder, Glycerin, Aloe Barbadensis, Tea Tree Oil.',
  },
].map((p) => ({ stock_qty: DEFAULT_STOCK, active: true, ...p }));

module.exports = { CATALOG };
