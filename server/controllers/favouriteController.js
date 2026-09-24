import db from '../database/db.js';

export function listMyFavourites(req, res) {
  const favourites = db
    .prepare(
      `SELECT c.*, cat.name AS category_name,
              (SELECT url FROM cake_images ci WHERE ci.cake_id = c.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image_url
       FROM favourites f
       JOIN cakes c ON c.id = f.cake_id
       LEFT JOIN categories cat ON cat.id = c.category_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`
    )
    .all(req.user.id);
  res.json({ favourites });
}

export function addFavourite(req, res) {
  const { cakeId } = req.body;
  const cake = db.prepare('SELECT id FROM cakes WHERE id = ?').get(cakeId);
  if (!cake) return res.status(404).json({ error: 'Cake not found.' });

  db.prepare('INSERT OR IGNORE INTO favourites (user_id, cake_id) VALUES (?, ?)').run(req.user.id, cakeId);
  res.status(201).json({ message: 'Added to favourites.' });
}

export function removeFavourite(req, res) {
  db.prepare('DELETE FROM favourites WHERE user_id = ? AND cake_id = ?').run(req.user.id, req.params.cakeId);
  res.json({ message: 'Removed from favourites.' });
}
