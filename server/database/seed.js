import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

function run() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@elorapatisserie.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'EloraAdmin123!';

  const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    db.prepare(
      'INSERT INTO admins (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run('Élora Studio Admin', adminEmail, hash, 'owner');
    console.log(`Admin seeded: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Admin already exists, skipping.');
  }

  const categories = [
    { name: 'Wedding', slug: 'wedding', description: 'Tiered sculptural cakes for the aisle and the reception.' },
    { name: 'Birthday', slug: 'birthday', description: 'Celebration cakes with couture detailing.' },
    { name: 'Anniversary', slug: 'anniversary', description: 'Cakes marking years, chapters, and milestones.' },
    { name: 'Engagement', slug: 'engagement', description: 'For the moment before the wedding moment.' },
    { name: "Valentine's Day", slug: 'valentines-day', description: 'Romance, plated.' },
    { name: 'Corporate', slug: 'corporate', description: 'Branded patisserie for launches and galas.' },
  ];

  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (name, slug, description) VALUES (@name, @slug, @description)'
  );
  categories.forEach((c) => insertCategory.run(c));

  const cakeCount = db.prepare('SELECT COUNT(*) AS n FROM cakes').get().n;
  if (cakeCount === 0) {
    const getCatId = (slug) => db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug).id;

    const cakes = [
      {
        name: 'Noir Champagne',
        slug: 'noir-champagne',
        category_id: getCatId('wedding'),
        description: 'Dark chocolate sponge, champagne mousseline, gold leaf lattice. A three-tier statement for the reception table.',
        base_price: 880,
        serves: '60–80 guests',
        is_featured: 1,
        status: 'published',
        catalog_number: 'N° 001',
      },
      {
        name: 'Rose Mocha Étude',
        slug: 'rose-mocha-etude',
        category_id: getCatId('anniversary'),
        description: 'Espresso genoise layered with dusty-rose buttercream and cocoa nib praline.',
        base_price: 320,
        serves: '10–14 guests',
        is_featured: 1,
        status: 'published',
        catalog_number: 'N° 002',
      },
      {
        name: 'Ivory Camélia',
        slug: 'ivory-camelia',
        category_id: getCatId('engagement'),
        description: 'Vanilla bean chiffon, white chocolate ganache, hand-piped sugar camellias.',
        base_price: 410,
        serves: '14–18 guests',
        is_featured: 1,
        status: 'published',
        catalog_number: 'N° 003',
      },
      {
        name: 'Velours Rouge',
        slug: 'velours-rouge',
        category_id: getCatId('valentines-day'),
        description: 'Classic red velvet, whipped mascarpone, dark chocolate shard crown.',
        base_price: 260,
        serves: '8–10 guests',
        is_featured: 0,
        status: 'published',
        catalog_number: 'N° 004',
      },
      {
        name: "L'Atelier Birthday",
        slug: 'atelier-birthday',
        category_id: getCatId('birthday'),
        description: 'Signature vanilla-caramel construction with a hand-lettered sugar plaque.',
        base_price: 240,
        serves: '8–10 guests',
        is_featured: 0,
        status: 'published',
        catalog_number: 'N° 005',
      },
      {
        name: 'Maison Gold Corporate',
        slug: 'maison-gold-corporate',
        category_id: getCatId('corporate'),
        description: 'Branded monogram tier, almond dacquoise, edible gold branding plaque.',
        base_price: 520,
        serves: '30–40 guests',
        is_featured: 0,
        status: 'published',
        catalog_number: 'N° 006',
      },
    ];

    const insertCake = db.prepare(
      `INSERT INTO cakes (name, slug, category_id, description, base_price, serves, is_featured, status, catalog_number)
       VALUES (@name, @slug, @category_id, @description, @base_price, @serves, @is_featured, @status, @catalog_number)`
    );
    const insertImage = db.prepare(
      'INSERT INTO cake_images (cake_id, url, is_primary, sort_order) VALUES (?, ?, 1, 0)'
    );

    const placeholderImages = {
      'noir-champagne': 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=1200',
      'rose-mocha-etude': 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=1200',
      'ivory-camelia': 'https://images.unsplash.com/photo-1622896972648-eb1c9028e0bf?q=80&w=1200',
      'velours-rouge': 'https://images.unsplash.com/photo-1586985289906-406988974504?q=80&w=1200',
      'atelier-birthday': 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?q=80&w=1200',
      'maison-gold-corporate': 'https://images.unsplash.com/photo-1607478900766-efe13248b125?q=80&w=1200',
    };

    cakes.forEach((cake) => {
      const info = insertCake.run(cake);
      insertImage.run(info.lastInsertRowid, placeholderImages[cake.slug]);
    });

    console.log(`Seeded ${cakes.length} cakes.`);
  } else {
    console.log('Cakes already seeded, skipping.');
  }

  const portfolioCount = db.prepare('SELECT COUNT(*) AS n FROM portfolio_items').get().n;
  if (portfolioCount === 0) {
    const portfolioSeed = [
      {
        title: 'Ivory & Gold Wedding Tier',
        description: 'A five-tier wedding centerpiece finished with hand-applied gold leaf and sugar orchids.',
        occasion: 'Wedding',
        category: 'wedding',
        event_date: '2026-03-14',
        tags: JSON.stringify(['wedding', 'gold leaf', 'five-tier']),
        portfolio_type: 'portfolio_only',
        featured: 1,
        image: 'https://images.unsplash.com/photo-1622896972648-eb1c9028e0bf?q=80&w=1200',
      },
      {
        title: "Emerald Anniversary Sculpture",
        description: 'A sculptural two-tier anniversary cake in deep emerald with edible marbling.',
        occasion: 'Anniversary',
        category: 'anniversary',
        event_date: '2026-01-20',
        tags: JSON.stringify(['anniversary', 'sculptural']),
        portfolio_type: 'portfolio_only',
        featured: 1,
        image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=1200',
      },
      {
        title: 'Blush Engagement Florals',
        description: 'Hand-piped blush buttercream florals over a vanilla chiffon base.',
        occasion: 'Engagement',
        category: 'engagement',
        event_date: '2025-11-02',
        tags: JSON.stringify(['engagement', 'florals']),
        portfolio_type: 'available_for_purchase',
        featured: 0,
        image: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?q=80&w=1200',
      },
      {
        title: 'Corporate Gala Monogram',
        description: 'A branded monogram cake commissioned for a product launch gala in KLCC.',
        occasion: 'Corporate',
        category: 'corporate',
        event_date: '2025-09-18',
        tags: JSON.stringify(['corporate', 'branded']),
        portfolio_type: 'portfolio_only',
        featured: 0,
        image: 'https://images.unsplash.com/photo-1586985289906-406988974504?q=80&w=1200',
      },
    ];

    const insertPortfolio = db.prepare(
      `INSERT INTO portfolio_items (title, description, image_url, occasion, category, event_date, tags, portfolio_type, featured)
       VALUES (@title, @description, @image, @occasion, @category, @event_date, @tags, @portfolio_type, @featured)`
    );
    const insertPortfolioImage = db.prepare(
      'INSERT INTO portfolio_images (portfolio_id, url, is_primary, sort_order) VALUES (?, ?, 1, 0)'
    );

    portfolioSeed.forEach((p) => {
      const info = insertPortfolio.run(p);
      insertPortfolioImage.run(info.lastInsertRowid, p.image);
    });

    console.log(`Seeded ${portfolioSeed.length} portfolio items.`);
  } else {
    console.log('Portfolio already seeded, skipping.');
  }

  const settings = [
    { key: 'business_name', value: 'Élora Patisserie' },
    { key: 'tagline', value: 'Made for moments worth remembering.' },
    { key: 'description', value: 'Handcrafted luxury cakes for weddings, celebrations, and the occasions in between.' },
    { key: 'whatsapp_number', value: '+60123456789' },
    { key: 'contact_email', value: 'hello@elorapatisserie.com' },
    { key: 'address', value: 'Bangsar, Kuala Lumpur, Malaysia' },
    { key: 'instagram_handle', value: '@elorapatisserie' },
    { key: 'tiktok_handle', value: '@elorapatisserie' },
    { key: 'facebook_url', value: '' },
    { key: 'opening_hours', value: 'Mon–Sat: 9am – 7pm · Sun: Closed' },
    { key: 'delivery_fee', value: '25' },
    { key: 'minimum_order', value: '150' },
    { key: 'logo_url', value: '' },
  ];
  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO business_settings (key, value) VALUES (@key, @value)'
  );
  settings.forEach((s) => insertSetting.run(s));

  console.log('Seed complete.');
}

run();
