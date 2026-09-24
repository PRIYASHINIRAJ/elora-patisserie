import db from '../database/db.js';

export function getPublicSettings(req, res) {
  const rows = db.prepare('SELECT key, value FROM business_settings').all();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({ settings });
}

export function getAdminSettings(req, res) {
  const rows = db.prepare('SELECT key, value FROM business_settings').all();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({ settings });
}

export function updateAdminSettings(req, res) {
  const updates = req.body; // { key: value, ... }
  const upsert = db.prepare(
    `INSERT INTO business_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  Object.entries(updates).forEach(([key, value]) => upsert.run(key, String(value ?? '')));

  const rows = db.prepare('SELECT key, value FROM business_settings').all();
  res.json({ settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
}

export function uploadLogo(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const url = `/uploads/media/${req.file.filename}`;
  db.prepare(
    `INSERT INTO business_settings (key, value) VALUES ('logo_url', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(url);
  res.json({ logoUrl: url });
}

export function uploadBakerPhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const url = `/uploads/media/${req.file.filename}`;
  db.prepare(
    `INSERT INTO business_settings (key, value) VALUES ('baker_photo_url', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(url);
  res.json({ photoUrl: url });
}
