import db from '../database/db.js';
import { removeStoredFile } from '../middleware/upload.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function nextCatalogNumber() {
  const { n } = await db.prepare('SELECT COUNT(*) AS n FROM cakes').get();
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

async function attachMedia(cake) {
  const images = await db
    .prepare('SELECT * FROM cake_images WHERE cake_id = ? ORDER BY is_primary DESC, sort_order ASC')
    .all(cake.id);
  const videos = await db.prepare('SELECT * FROM cake_videos WHERE cake_id = ? ORDER BY sort_order ASC').all(cake.id);
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

export async function listAdminCakes(req, res) {
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
  const cakes = await db.prepare(query).all(...params);
  res.json({ cakes });
}

export async function getAdminCake(req, res) {
  const cake = await db.prepare('SELECT * FROM cakes WHERE id = ?').get(req.params.id);
  if (!cake) return res.status(404).json({ error: 'Cake not found.' });
  res.json({ cake: await attachMedia(cake) });
}

export async function createCake(req, res) {
  const body = req.body;
  if (!body.name) return res.status(400).json({ error: 'Cake name is required.' });

  let slug = slugify(body.name);
  const existing = await db.prepare('SELECT id FROM cakes WHERE slug = ?').get(slug);
  if (existing) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const info = await db
    .prepare(
      `INSERT INTO cakes
       (name, slug, category_id, description, base_price, serves, is_customizable, is_featured,
        status, catalog_number, flavour, filling, sizes, ingredients, colours, customization_options,
        tags, is_available, in_portfolio)
       VALUES (@name, @slug, @category_id, @description, @base_price, @serves, @is_customizable, @is_featured,
        @status, @catalog_number, @flavour, @filling, @sizes, @ingredients, @colours, @customization_options,
        @tags, @is_available, @in_portfolio)`
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
      catalog_number: await nextCatalogNumber(),
      flavour: body.flavour || null,
      filling: body.filling || null,
      sizes: JSON.stringify(parseJsonArray(body.sizes)),
      ingredients: JSON.stringify(parseJsonArray(body.ingredients)),
      colours: JSON.stringify(parseJsonArray(body.colours)),
      customization_options: JSON.stringify(parseJsonArray(body.customizationOptions)),
      tags: JSON.stringify(parseJsonArray(body.tags)),
      is_available: body.isAvailable === 'false' ? 0 : 1,
      in_portfolio: body.inPortfolio === 'true' ? 1 : 0,
    });

  const cakeId = info.lastInsertRowid;
  await saveIncomingFiles(cakeId, req.files);

  const cake = await db.prepare('SELECT * FROM cakes WHERE id = ?').get(cakeId);
  res.status(201).json({ cake: await attachMedia(cake) });
}

async function saveIncomingFiles(cakeId, files) {
  if (!files) return;

  if (files.mainImage?.[0]) {
    const f = files.mainImage[0];
    const url = f.url;
    // demote any existing primary
    await db.prepare('UPDATE cake_images SET is_primary = 0 WHERE cake_id = ?').run(cakeId);
    await db.prepare('INSERT INTO cake_images (cake_id, url, is_primary, sort_order) VALUES (?, ?, 1, -1)').run(cakeId, url);
  }

  if (files.galleryImages?.length) {
    const insert = db.prepare('INSERT INTO cake_images (cake_id, url, is_primary, sort_order) VALUES (?, ?, 0, ?)');
    for (const [idx, f] of files.galleryImages.entries()) {
      await insert.run(cakeId, f.url, idx);
    }
  }

  if (files.videos?.length) {
    const insert = db.prepare('INSERT INTO cake_videos (cake_id, url, sort_order) VALUES (?, ?, ?)');
    for (const [idx, f] of files.videos.entries()) {
      await insert.run(cakeId, f.url, idx);
    }
  }
}

export async function updateCake(req, res) {
  const cake = await db.prepare('SELECT * FROM cakes WHERE id = ?').get(req.params.id);
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
    in_portfolio: body.inPortfolio !== undefined ? (body.inPortfolio === 'true' ? 1 : 0) : cake.in_portfolio,
  };

  await db.prepare(
    `UPDATE cakes SET
      name=@name, category_id=@category_id, description=@description, base_price=@base_price,
      serves=@serves, is_customizable=@is_customizable, is_featured=@is_featured, status=@status,
      flavour=@flavour, filling=@filling, sizes=@sizes, ingredients=@ingredients, colours=@colours,
      customization_options=@customization_options, tags=@tags, is_available=@is_available, in_portfolio=@in_portfolio,
      updated_at = datetime('now')
     WHERE id=@id`
  ).run({ ...updated, id: cake.id });

  await saveIncomingFiles(cake.id, req.files);

  const fresh = await db.prepare('SELECT * FROM cakes WHERE id = ?').get(cake.id);
  res.json({ cake: await attachMedia(fresh) });
}

export async function setCakeStatus(req, res) {
  const { status } = req.body; // draft | published | archived
  if (!['draft', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const cake = await db.prepare('SELECT * FROM cakes WHERE id = ?').get(req.params.id);
  if (!cake) return res.status(404).json({ error: 'Cake not found.' });

  await db.prepare("UPDATE cakes SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, cake.id);
  res.json({ message: `Cake marked as ${status}.` });
}

export async function deleteCake(req, res) {
  const cake = await db.prepare('SELECT * FROM cakes WHERE id = ?').get(req.params.id);
  if (!cake) return res.status(404).json({ error: 'Cake not found.' });

  const images = await db.prepare('SELECT url FROM cake_images WHERE cake_id = ?').all(cake.id);
  const videos = await db.prepare('SELECT url FROM cake_videos WHERE cake_id = ?').all(cake.id);
  await Promise.all([...images, ...videos].map((m) => removeStoredFile(m.url)));

  await db.prepare('DELETE FROM cake_images WHERE cake_id = ?').run(cake.id);
  await db.prepare('DELETE FROM cake_videos WHERE cake_id = ?').run(cake.id);
  await db.prepare('DELETE FROM cakes WHERE id = ?').run(cake.id);
  res.json({ message: 'Cake deleted.' });
}

export async function deleteCakeImage(req, res) {
  const image = await db.prepare('SELECT * FROM cake_images WHERE id = ? AND cake_id = ?').get(req.params.imageId, req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  await removeStoredFile(image.url);
  await db.prepare('DELETE FROM cake_images WHERE id = ?').run(image.id);
  res.json({ message: 'Image removed.' });
}

export async function deleteCakeVideo(req, res) {
  const video = await db.prepare('SELECT * FROM cake_videos WHERE id = ? AND cake_id = ?').get(req.params.videoId, req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found.' });
  await removeStoredFile(video.url);
  await db.prepare('DELETE FROM cake_videos WHERE id = ?').run(video.id);
  res.json({ message: 'Video removed.' });
}

export async function setPrimaryImage(req, res) {
  const image = await db.prepare('SELECT * FROM cake_images WHERE id = ? AND cake_id = ?').get(req.params.imageId, req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  await db.prepare('UPDATE cake_images SET is_primary = 0 WHERE cake_id = ?').run(req.params.id);
  await db.prepare('UPDATE cake_images SET is_primary = 1 WHERE id = ?').run(image.id);
  res.json({ message: 'Primary image updated.' });
}
