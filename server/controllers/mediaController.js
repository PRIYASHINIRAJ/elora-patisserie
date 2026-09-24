import db from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { publicUrlFor, fileType } from '../middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '..', 'uploads');

function unlinkQuiet(relativeUrl) {
  if (!relativeUrl || !relativeUrl.startsWith('/uploads/')) return;
  const filePath = path.join(uploadsRoot, relativeUrl.replace('/uploads/', ''));
  fs.unlink(filePath, () => {});
}

export function listMedia(req, res) {
  const { type } = req.query;
  let query = 'SELECT * FROM media';
  const params = [];
  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }
  query += ' ORDER BY created_at DESC';
  const items = db.prepare(query).all(...params);
  res.json({ items });
}

export function uploadMedia(req, res) {
  if (!req.files?.length) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }

  const insert = db.prepare(
    'INSERT INTO media (url, type, original_name, size_bytes) VALUES (?, ?, ?, ?)'
  );
  const created = req.files.map((f) => {
    const url = publicUrlFor('media', f.filename);
    const type = fileType(f.mimetype);
    const info = insert.run(url, type, f.originalname, f.size);
    return db.prepare('SELECT * FROM media WHERE id = ?').get(info.lastInsertRowid);
  });

  res.status(201).json({ items: created });
}

export function deleteMedia(req, res) {
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Media item not found.' });
  unlinkQuiet(item.url);
  db.prepare('DELETE FROM media WHERE id = ?').run(item.id);
  res.json({ message: 'Media deleted.' });
}

export function attachMedia(req, res) {
  const { attachedToType, attachedToId } = req.body; // 'cake' | 'portfolio'
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Media item not found.' });

  if (!['cake', 'portfolio'].includes(attachedToType) || !attachedToId) {
    return res.status(400).json({ error: 'attachedToType (cake|portfolio) and attachedToId are required.' });
  }

  if (attachedToType === 'cake') {
    const target = db.prepare('SELECT id FROM cakes WHERE id = ?').get(attachedToId);
    if (!target) return res.status(404).json({ error: 'Cake not found.' });
    if (item.type === 'video') {
      db.prepare('INSERT INTO cake_videos (cake_id, url) VALUES (?, ?)').run(attachedToId, item.url);
    } else {
      db.prepare('INSERT INTO cake_images (cake_id, url) VALUES (?, ?)').run(attachedToId, item.url);
    }
  } else {
    const target = db.prepare('SELECT id FROM portfolio_items WHERE id = ?').get(attachedToId);
    if (!target) return res.status(404).json({ error: 'Portfolio item not found.' });
    if (item.type === 'video') {
      db.prepare('INSERT INTO portfolio_videos (portfolio_id, url) VALUES (?, ?)').run(attachedToId, item.url);
    } else {
      db.prepare('INSERT INTO portfolio_images (portfolio_id, url) VALUES (?, ?)').run(attachedToId, item.url);
    }
  }

  db.prepare('UPDATE media SET attached_to_type = ?, attached_to_id = ? WHERE id = ?').run(
    attachedToType,
    attachedToId,
    item.id
  );

  res.json({ message: 'Media attached.' });
}
