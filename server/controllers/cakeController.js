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

export function listCakes(req, res) {
  const { category, featured } = req.query;

  let query = `
    SELECT c.*, cat.name AS category_name, cat.slug AS category_slug,
           (SELECT url FROM cake_images ci WHERE ci.cake_id = c.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image_url
    FROM cakes c
    LEFT JOIN categories cat ON cat.id = c.category_id
    WHERE c.status = 'published'
  `;
  const params = [];

  if (category) {
    query += ' AND cat.slug = ?';
    params.push(category);
  }
  if (featured === 'true') {
    query += ' AND c.is_featured = 1';
  }
  query += ' ORDER BY c.created_at DESC';

  const cakes = db.prepare(query).all(...params).map((c) => ({
    ...c,
    tags: parseJsonArray(c.tags),
    colours: parseJsonArray(c.colours),
  }));
  res.json({ cakes });
}

export function getCakeBySlug(req, res) {
  const cake = db
    .prepare(
      `SELECT c.*, cat.name AS category_name, cat.slug AS category_slug
       FROM cakes c
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE c.slug = ? AND c.status = 'published'`
    )
    .get(req.params.slug);

  if (!cake) return res.status(404).json({ error: 'Cake not found.' });

  const images = db
    .prepare('SELECT * FROM cake_images WHERE cake_id = ? ORDER BY is_primary DESC, sort_order ASC')
    .all(cake.id);
  const videos = db.prepare('SELECT * FROM cake_videos WHERE cake_id = ? ORDER BY sort_order ASC').all(cake.id);

  res.json({
    cake: {
      ...cake,
      sizes: parseJsonArray(cake.sizes),
      ingredients: parseJsonArray(cake.ingredients),
      colours: parseJsonArray(cake.colours),
      customization_options: parseJsonArray(cake.customization_options),
      tags: parseJsonArray(cake.tags),
    },
    images,
    videos,
  });
}

export function listCategories(req, res) {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  res.json({ categories });
}
