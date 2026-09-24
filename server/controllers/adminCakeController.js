import db from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { publicUrlFor } from '../middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '..', 'uploads');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function nextCatalogNumber() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM cakes').get();
  return `N° ${String(n + 1).padStart(3, '0')}`;
}

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

function attachMedia(cake) {
  const images = db
    .prepare('SELECT * FROM cake_images WHERE cake_id = ? ORDER BY is_primary DESC, sort_order ASC')
    .all(cake.id);
  const videos = db.prepare('SELECT * FROM cake_videos WHERE cake_id = ? ORDER BY sort_order ASC').all(cake.id);
  return {
    ...cake,
    sizes: parseJsonArray(cake.sizes),
    ingredients: parseJsonArray(cake.ingredients),
    colours: parseJsonArray(cake.colours),
    customization_options: parseJsonArray(cake.customization_options),
    tags: parseJsonArray(cake.tags),
    images,
    videos,
  };
}

export function listAdminCakes(req, res) {
  const { status } = req.query;
  let query = `
    SELECT c.*, cat.name AS category_name,
           (SELECT url FROM cake_images ci WHERE ci.cake_id = c.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image_url
    FROM cakes c
    LEFT JOIN categories cat ON cat.id = c.category_id
  `;
  const params = [];
  if (status) {
    query += ' WHERE c.status = ?';
    params.push(status);
  }
  query += ' ORDER BY c.created_at DESC';
  const cakes = db.prepare(query).all(...params);
  res.json({ cakes });
}

export function getAdminCake(req, res) {
  const cake = db.prepare('SELECT * FROM cakes WHERE id = ?').get(req.params.id);
  if (!cake) return res.status(404).json({ error: 'Cake not found.' });
  res.json({ cake: attachMedia(cake) });
}

export function createCake(req, res) {
  const body = req.body;
  if (!body.name) return res.status(400).json({ error: 'Cake name is required.' });

  let slug = slugify(body.name);
  const existing = db.prepare('SELECT id FROM cakes WHERE slug = ?').get(slug);
  if (existing) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const info = db
    .prepare(
      `INSERT INTO cakes
       (name, slug, category_id, description, base_price, serves, is_customizable, is_featured,
        status, catalog_number, flavour, filling, sizes, ingredients, colours, customization_options,
        tags, is_available)
       VALUES (@name, @slug, @category_id, @description, @base_price, @serves, @is_customizable, @is_featured,
        @status, @catalog_number, @flavour, @filling, @sizes, @ingredients, @colours, @customization_options,
        @tags, @is_available)`
    )
    .run({
      name: body.name,
      slug,
      category_id: body.categoryId || null,
      description: body.description || null,
      base_price: Number(body.basePrice) || 0,
      serves: body.serves || null,
      is_customizable: body.isCustomizable === 'false' ? 0 : 1,
      is_featured: body.isFeatured === 'true' ? 1 : 0,
      status: body.status === 'published' ? 'published' : 'draft',
      catalog_number: nextCatalogNumber(),
      flavour: body.flavour || null,
      filling: body.filling || null,
      sizes: JSON.stringify(parseJsonArray(body.sizes)),
      ingredients: JSON.stringify(parseJsonArray(body.ingredients)),
      colours: JSON.stringify(parseJsonArray(body.colours)),
      customization_options: JSON.stringify(parseJsonArray(body.customizationOptions)),
      tags: JSON.stringify(parseJsonArray(body.tags)),
      is_available: body.isAvailable === 'false' ? 0 : 1,
    });

  const cakeId = info.lastInsertRowid;
  saveIncomingFiles(cakeId, req.files);

  const cake = db.prepare('SELECT * FROM cakes WHERE id = ?').get(cakeId);
  res.status(201).json({ cake: attachMedia(cake) });
}

function saveIncomingFiles(cakeId, files) {
  if (!files) return;

  if (files.mainImage?.[0]) {
    const f = files.mainImage[0];
    const url = publicUrlFor('cakes', f.filename);
    // demote any existing primary
    db.prepare('UPDATE cake_images SET is_primary = 0 WHERE cake_id = ?').run(cakeId);
    db.prepare('INSERT INTO cake_images (cake_id, url, is_primary, sort_order) VALUES (?, ?, 1, -1)').run(cakeId, url);
  }

  if (files.galleryImages?.length) {
    const insert = db.prepare('INSERT INTO cake_images (cake_id, url, is_primary, sort_order) VALUES (?, ?, 0, ?)');
    files.galleryImages.forEach((f, idx) => {
      insert.run(cakeId, publicUrlFor('cakes', f.filename), idx);
    });
  }

  if (files.videos?.length) {
    const insert = db.prepare('INSERT INTO cake_videos (cake_id, url, sort_order) VALUES (?, ?, ?)');
    files.videos.forEach((f, idx) => {
      insert.run(cakeId, publicUrlFor('cakes', f.filename), idx);
    });
  }
}

export function updateCake(req, res) {
  const cake = db.prepare('SELECT * FROM cakes WHERE id = ?').get(req.params.id);
  if (!cake) return res.status(404).json({ error: 'Cake not found.' });

  const body = req.body;
  const updated = {
    name: body.name ?? cake.name,
    category_id: body.categoryId !== undefined ? body.categoryId || null : cake.category_id,
    description: body.description !== undefined ? body.description : cake.description,
    base_price: body.basePrice !== undefined ? Number(body.basePrice) || 0 : cake.base_price,
    serves: body.serves !== undefined ? body.serves : cake.serves,
    is_customizable: body.isCustomizable !== undefined ? (body.isCustomizable === 'false' ? 0 : 1) : cake.is_customizable,
    is_featured: body.isFeatured !== undefined ? (body.isFeatured === 'true' ? 1 : 0) : cake.is_featured,
    status: body.status !== undefined ? body.status : cake.status,
    flavour: body.flavour !== undefined ? body.flavour : cake.flavour,
    filling: body.filling !== undefined ? body.filling : cake.filling,
    sizes: body.sizes !== undefined ? JSON.stringify(parseJsonArray(body.sizes)) : cake.sizes,
    ingredients: body.ingredients !== undefined ? JSON.stringify(parseJsonArray(body.ingredients)) : cake.ingredients,
    colours: body.colours !== undefined ? JSON.stringify(parseJsonArray(body.colours)) : cake.colours,
    customization_options:
      body.customizationOptions !== undefined ? JSON.stringify(parseJsonArray(body.customizationOptions)) : cake.customization_options,
    tags: body.tags !== undefined ? JSON.stringify(parseJsonArray(body.tags)) : cake.tags,
    is_available: body.isAvailable !== undefined ? (body.isAvailable === 'false' ? 0 : 1) : cake.is_available,
  };

  db.prepare(
    `UPDATE cakes SET
      name=@name, category_id=@category_id, description=@description, base_price=@base_price,
      serves=@serves, is_customizable=@is_customizable, is_featured=@is_featured, status=@status,
      flavour=@flavour, filling=@filling, sizes=@sizes, ingredients=@ingredients, colours=@colours,
      customization_options=@customization_options, tags=@tags, is_available=@is_available,
      updated_at = datetime('now')
     WHERE id=@id`
  ).run({ ...updated, id: cake.id });

  saveIncomingFiles(cake.id, req.files);

  const fresh = db.prepare('SELECT * FROM cakes WHERE id = ?').get(cake.id);
  res.json({ cake: attachMedia(fresh) });
}

export function setCakeStatus(req, res) {
  const { status } = req.body; // draft | published | archived
  if (!['draft', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const cake = db.prepare('SELECT * FROM cakes WHERE id = ?').get(req.params.id);
  if (!cake) return res.status(404).json({ error: 'Cake not found.' });

  db.prepare("UPDATE cakes SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, cake.id);
  res.json({ message: `Cake marked as ${status}.` });
}

export function deleteCake(req, res) {
  const cake = db.prepare('SELECT * FROM cakes WHERE id = ?').get(req.params.id);
  if (!cake) return res.status(404).json({ error: 'Cake not found.' });

  const images = db.prepare('SELECT url FROM cake_images WHERE cake_id = ?').all(cake.id);
  const videos = db.prepare('SELECT url FROM cake_videos WHERE cake_id = ?').all(cake.id);
  images.forEach((i) => unlinkQuiet(i.url));
  videos.forEach((v) => unlinkQuiet(v.url));

  db.prepare('DELETE FROM cakes WHERE id = ?').run(cake.id); // cascades images/videos
  res.json({ message: 'Cake deleted.' });
}

export function deleteCakeImage(req, res) {
  const image = db.prepare('SELECT * FROM cake_images WHERE id = ? AND cake_id = ?').get(req.params.imageId, req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  unlinkQuiet(image.url);
  db.prepare('DELETE FROM cake_images WHERE id = ?').run(image.id);
  res.json({ message: 'Image removed.' });
}

export function deleteCakeVideo(req, res) {
  const video = db.prepare('SELECT * FROM cake_videos WHERE id = ? AND cake_id = ?').get(req.params.videoId, req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found.' });
  unlinkQuiet(video.url);
  db.prepare('DELETE FROM cake_videos WHERE id = ?').run(video.id);
  res.json({ message: 'Video removed.' });
}

export function setPrimaryImage(req, res) {
  const image = db.prepare('SELECT * FROM cake_images WHERE id = ? AND cake_id = ?').get(req.params.imageId, req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  db.prepare('UPDATE cake_images SET is_primary = 0 WHERE cake_id = ?').run(req.params.id);
  db.prepare('UPDATE cake_images SET is_primary = 1 WHERE id = ?').run(image.id);
  res.json({ message: 'Primary image updated.' });
}
