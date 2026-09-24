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

export function listPortfolio(req, res) {
  const { category, occasion } = req.query;

  let query = 'SELECT * FROM portfolio_items WHERE 1=1';
  const params = [];
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (occasion) {
    query += ' AND occasion = ?';
    params.push(occasion);
  }
  query += ' ORDER BY featured DESC, created_at DESC';

  const items = db.prepare(query).all(...params);
  const withMedia = items.map((item) => {
    const images = db
      .prepare('SELECT * FROM portfolio_images WHERE portfolio_id = ? ORDER BY is_primary DESC, sort_order ASC')
      .all(item.id);
    const videos = db.prepare('SELECT * FROM portfolio_videos WHERE portfolio_id = ? ORDER BY sort_order ASC').all(item.id);
    return { ...item, tags: parseJsonArray(item.tags), images, videos };
  });

  res.json({ items: withMedia });
}

export function getPortfolioItem(req, res) {
  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found.' });

  const images = db
    .prepare('SELECT * FROM portfolio_images WHERE portfolio_id = ? ORDER BY is_primary DESC, sort_order ASC')
    .all(item.id);
  const videos = db.prepare('SELECT * FROM portfolio_videos WHERE portfolio_id = ? ORDER BY sort_order ASC').all(item.id);

  let linkedCake = null;
  if (item.linked_cake_id) {
    linkedCake = db.prepare('SELECT id, name, slug, base_price FROM cakes WHERE id = ?').get(item.linked_cake_id);
  }

  res.json({ item: { ...item, tags: parseJsonArray(item.tags), images, videos, linkedCake } });
}
