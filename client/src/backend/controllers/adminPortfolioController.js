import db from '../database/db.js';
import { removeStoredFile } from '../middleware/upload.js';

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

async function attachMedia(item) {
  const images = await db
    .prepare('SELECT * FROM portfolio_images WHERE portfolio_id = ? ORDER BY is_primary DESC, sort_order ASC')
    .all(item.id);
  const videos = await db.prepare('SELECT * FROM portfolio_videos WHERE portfolio_id = ? ORDER BY sort_order ASC').all(item.id);
  return { ...item, tags: parseJsonArray(item.tags), images, videos };
}

async function saveIncomingFiles(portfolioId, files) {
  if (!files) return null;
  let firstImageUrl = null;

  if (files.images?.length) {
    const insert = db.prepare(
      'INSERT INTO portfolio_images (portfolio_id, url, is_primary, sort_order) VALUES (?, ?, ?, ?)'
    );
    for (const [idx, f] of files.images.entries()) {
      await insert.run(portfolioId, f.url, idx === 0 ? 1 : 0, idx);
      if (idx === 0) firstImageUrl = f.url;
    }
  }

  if (files.videos?.length) {
    const insert = db.prepare('INSERT INTO portfolio_videos (portfolio_id, url, sort_order) VALUES (?, ?, ?)');
    for (const [idx, f] of files.videos.entries()) {
      await insert.run(portfolioId, f.url, idx);
    }
  }

  return firstImageUrl;
}

export async function listAdminPortfolio(req, res) {
  const items = await db.prepare('SELECT * FROM portfolio_items ORDER BY created_at DESC').all();
  res.json({ items: await Promise.all(items.map(attachMedia)) });
}

export async function getAdminPortfolioItem(req, res) {
  const item = await db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found.' });
  res.json({ item: await attachMedia(item) });
}

export async function createPortfolioItem(req, res) {
  const body = req.body;
  if (!body.title) return res.status(400).json({ error: 'Title is required.' });
  if (!req.files?.images?.length) {
    return res.status(400).json({ error: 'At least one photo is required.' });
  }

  const info = await db
    .prepare(
      `INSERT INTO portfolio_items
       (title, description, image_url, occasion, category, event_date, tags, portfolio_type, linked_cake_id, featured)
       VALUES (@title, @description, @image_url, @occasion, @category, @event_date, @tags, @portfolio_type, @linked_cake_id, @featured)`
    )
    .run({
      title: body.title,
      description: body.description || null,
      image_url: 'pending', // replaced below once files are saved
      occasion: body.occasion || null,
      category: body.category || null,
      event_date: body.eventDate || null,
      tags: JSON.stringify(parseJsonArray(body.tags)),
      portfolio_type: body.portfolioType === 'available_for_purchase' ? 'available_for_purchase' : 'portfolio_only',
      linked_cake_id: body.linkedCakeId || null,
      featured: body.featured === 'true' ? 1 : 0,
    });

  const portfolioId = info.lastInsertRowid;
  const firstImageUrl = await saveIncomingFiles(portfolioId, req.files);
  await db.prepare('UPDATE portfolio_items SET image_url = ? WHERE id = ?').run(firstImageUrl, portfolioId);

  const item = await db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(portfolioId);
  res.status(201).json({ item: await attachMedia(item) });
}

export async function updatePortfolioItem(req, res) {
  const item = await db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found.' });

  const body = req.body;
  await db.prepare(
    `UPDATE portfolio_items SET
      title=@title, description=@description, occasion=@occasion, category=@category,
      event_date=@event_date, tags=@tags, portfolio_type=@portfolio_type, linked_cake_id=@linked_cake_id,
      featured=@featured, updated_at=datetime('now')
     WHERE id=@id`
  ).run({
    title: body.title ?? item.title,
    description: body.description !== undefined ? body.description : item.description,
    occasion: body.occasion !== undefined ? body.occasion : item.occasion,
    category: body.category !== undefined ? body.category : item.category,
    event_date: body.eventDate !== undefined ? body.eventDate : item.event_date,
    tags: body.tags !== undefined ? JSON.stringify(parseJsonArray(body.tags)) : item.tags,
    portfolio_type: body.portfolioType !== undefined ? body.portfolioType : item.portfolio_type,
    linked_cake_id: body.linkedCakeId !== undefined ? body.linkedCakeId || null : item.linked_cake_id,
    featured: body.featured !== undefined ? (body.featured === 'true' ? 1 : 0) : item.featured,
    id: item.id,
  });

  const firstNewImageUrl = await saveIncomingFiles(item.id, req.files);
  if (firstNewImageUrl && item.image_url === 'pending') {
    await db.prepare('UPDATE portfolio_items SET image_url = ? WHERE id = ?').run(firstNewImageUrl, item.id);
  }

  const fresh = await db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(item.id);
  res.json({ item: await attachMedia(fresh) });
}

export async function deletePortfolioItem(req, res) {
  const item = await db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found.' });

  const images = await db.prepare('SELECT url FROM portfolio_images WHERE portfolio_id = ?').all(item.id);
  const videos = await db.prepare('SELECT url FROM portfolio_videos WHERE portfolio_id = ?').all(item.id);
  await Promise.all([...images, ...videos].map((m) => removeStoredFile(m.url)));

  await db.prepare('DELETE FROM portfolio_images WHERE portfolio_id = ?').run(item.id);
  await db.prepare('DELETE FROM portfolio_videos WHERE portfolio_id = ?').run(item.id);
  await db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(item.id);
  res.json({ message: 'Portfolio item deleted.' });
}

export async function deletePortfolioImage(req, res) {
  const image = await db
    .prepare('SELECT * FROM portfolio_images WHERE id = ? AND portfolio_id = ?')
    .get(req.params.imageId, req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  await removeStoredFile(image.url);
  await db.prepare('DELETE FROM portfolio_images WHERE id = ?').run(image.id);
  res.json({ message: 'Image removed.' });
}
