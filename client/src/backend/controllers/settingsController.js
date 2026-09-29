import db from '../database/db.js';

export async function getPublicSettings(req, res) {
  const rows = await db.prepare('SELECT key, value FROM business_settings').all();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({ settings });
}

export async function getAdminSettings(req, res) {
  const rows = await db.prepare('SELECT key, value FROM business_settings').all();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({ settings });
}

export async function updateAdminSettings(req, res) {
  const updates = req.body; // { key: value, ... }
  const upsert = db.prepare(
    `INSERT INTO business_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  for (const [key, value] of Object.entries(updates)) await upsert.run(key, String(value ?? ''));

  const rows = await db.prepare('SELECT key, value FROM business_settings').all();
  res.json({ settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
}

export async function uploadLogo(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const url = req.file.url;
  await db.prepare(
    `INSERT INTO business_settings (key, value) VALUES ('logo_url', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(url);
  res.json({ logoUrl: url });
}

export async function uploadBakerPhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const url = req.file.url;
  await db.prepare(
    `INSERT INTO business_settings (key, value) VALUES ('baker_photo_url', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(url);
  res.json({ photoUrl: url });
}
