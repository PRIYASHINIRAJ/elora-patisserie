import db from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { publicUrlFor } from '../middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '..', 'uploads');

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

function unlinkQuiet(relativeUrl) {
  if (!relativeUrl || !relativeUrl.startsWith('/uploads/')) return;
  const filePath = path.join(uploadsRoot, relativeUrl.replace('/uploads/', ''));
  fs.unlink(filePath, () => {});
}

function attachMedia(item) {
  const images = db
    .prepare('SELECT * FROM portfolio_images WHERE portfolio_id = ? ORDER BY is_primary DESC, sort_order ASC')
    .all(item.id);
  const videos = db.prepare('SELECT * FROM portfolio_videos WHERE portfolio_id = ? ORDER BY sort_order ASC').all(item.id);
  return { ...item, tags: parseJsonArray(item.tags), images, videos };
}

function saveIncomingFiles(portfolioId, files) {
  if (!files) return null;
  let firstImageUrl = null;

  if (files.images?.length) {
    const insert = db.prepare(
      'INSERT INTO portfolio_images (portfolio_id, url, is_primary, sort_order) VALUES (?, ?, ?, ?)'
    );
    files.images.forEach((f, idx) => {
      const url = publicUrlFor('portfolio', f.filename);
      insert.run(portfolioId, url, idx === 0 ? 1 : 0, idx);
      if (idx === 0) firstImageUrl = url;
    });
  }

  if (files.videos?.length) {
    const insert = db.prepare('INSERT INTO portfolio_videos (portfolio_id, url, sort_order) VALUES (?, ?, ?)');
    files.videos.forEach((f, idx) => {
      insert.run(portfolioId, publicUrlFor('portfolio', f.filename), idx);
    });
  }

  return firstImageUrl;
}

export function listAdminPortfolio(req, res) {
  const items = db.prepare('SELECT * FROM portfolio_items ORDER BY created_at DESC').all();
  res.json({ items: items.map(attachMedia) });
}

export function getAdminPortfolioItem(req, res) {
  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found.' });
  res.json({ item: attachMedia(item) });
}

export function createPortfolioItem(req, res) {
  const body = req.body;
  if (!body.title) return res.status(400).json({ error: 'Title is required.' });
  if (!req.files?.images?.length) {
    return res.status(400).json({ error: 'At least one photo is required.' });
  }

  const info = db
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
  const firstImageUrl = saveIncomingFiles(portfolioId, req.files);
  db.prepare('UPDATE portfolio_items SET image_url = ? WHERE id = ?').run(firstImageUrl, portfolioId);

  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(portfolioId);
  res.status(201).json({ item: attachMedia(item) });
}

export function updatePortfolioItem(req, res) {
  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found.' });

  const body = req.body;
  db.prepare(
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

  const firstNewImageUrl = saveIncomingFiles(item.id, req.files);
  if (firstNewImageUrl && item.image_url === 'pending') {
    db.prepare('UPDATE portfolio_items SET image_url = ? WHERE id = ?').run(firstNewImageUrl, item.id);
  }

  const fresh = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(item.id);
  res.json({ item: attachMedia(fresh) });
}

export function deletePortfolioItem(req, res) {
  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found.' });

  const images = db.prepare('SELECT url FROM portfolio_images WHERE portfolio_id = ?').all(item.id);
  const videos = db.prepare('SELECT url FROM portfolio_videos WHERE portfolio_id = ?').all(item.id);
  images.forEach((i) => unlinkQuiet(i.url));
  videos.forEach((v) => unlinkQuiet(v.url));

  db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(item.id);
  res.json({ message: 'Portfolio item deleted.' });
}

export function deletePortfolioImage(req, res) {
  const image = db
    .prepare('SELECT * FROM portfolio_images WHERE id = ? AND portfolio_id = ?')
    .get(req.params.imageId, req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  unlinkQuiet(image.url);
  db.prepare('DELETE FROM portfolio_images WHERE id = ?').run(image.id);
  res.json({ message: 'Image removed.' });
}
