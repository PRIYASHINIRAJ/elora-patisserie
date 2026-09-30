import db from '../database/db.js';

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// The portfolio is made of cakes the admin ticked "Show in Portfolio". Each is
// returned in the portfolio item shape the site already uses.
async function toPortfolioItem(cake) {
  const images = await db
    .prepare('SELECT * FROM cake_images WHERE cake_id = ? ORDER BY is_primary DESC, sort_order ASC')
    .all(cake.id);
  const videos = await db.prepare('SELECT * FROM cake_videos WHERE cake_id = ? ORDER BY sort_order ASC').all(cake.id);
  const purchasable = cake.status === 'published';
  return {
    id: cake.id,
    title: cake.name,
    description: cake.description,
    image_url: images[0]?.url || null,
    occasion: cake.category_name,
    category: cake.category_slug,
    featured: cake.is_featured,
    tags: parseJsonArray(cake.tags),
    portfolio_type: purchasable ? 'available_for_purchase' : 'portfolio_only',
    linked_cake_id: purchasable ? cake.id : null,
    created_at: cake.created_at,
    images,
    videos,
    linkedCake: purchasable ? { id: cake.id, name: cake.name, slug: cake.slug, base_price: cake.base_price } : null,
  };
}

const PORTFOLIO_CAKES = `
  SELECT c.*, cat.name AS category_name, cat.slug AS category_slug
  FROM cakes c
  LEFT JOIN categories cat ON cat.id = c.category_id
  WHERE c.in_portfolio = 1 AND c.status != 'archived'`;

export async function listPortfolio(req, res) {
  const { category, occasion } = req.query;

  let query = PORTFOLIO_CAKES;
  const params = [];
  if (category) {
    query += ' AND cat.slug = ?';
    params.push(category);
  }
  if (occasion) {
    query += ' AND cat.name = ?';
    params.push(occasion);
  }
  query += ' ORDER BY c.is_featured DESC, c.created_at DESC';

  const cakes = await db.prepare(query).all(...params);
  const items = (await Promise.all(cakes.map(toPortfolioItem))).filter((i) => i.image_url);
  res.json({ items });
}

export async function getPortfolioItem(req, res) {
  const cake = await db.prepare(`${PORTFOLIO_CAKES} AND c.id = ?`).get(req.params.id);
  if (!cake) return res.status(404).json({ error: 'Portfolio item not found.' });
  res.json({ item: await toPortfolioItem(cake) });
}
