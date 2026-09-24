import db from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { publicUrlFor } from '../middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '..', 'uploads');

function unlinkQuiet(relativeUrl) {
  if (!relativeUrl || !relativeUrl.startsWith('/uploads/')) return;
  const filePath = path.join(uploadsRoot, relativeUrl.replace('/uploads/', ''));
  fs.unlink(filePath, () => {});
}

export function listPublicStudioVideos(req, res) {
  const videos = db
    .prepare('SELECT * FROM studio_videos WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC')
    .all();
  res.json({ videos });
}

export function listAdminStudioVideos(req, res) {
  const videos = db.prepare('SELECT * FROM studio_videos ORDER BY sort_order ASC, created_at DESC').all();
  res.json({ videos });
}

export function createStudioVideo(req, res) {
  if (!req.file) return res.status(400).json({ error: 'A video file is required.' });
  const { caption, tiktokUrl } = req.body;

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM studio_videos').get().m;
  const url = publicUrlFor('studio-videos', req.file.filename);

  const info = db
    .prepare(
      `INSERT INTO studio_videos (video_url, caption, tiktok_url, sort_order, is_active) VALUES (?, ?, ?, ?, 1)`
    )
    .run(url, caption || null, tiktokUrl || null, maxOrder + 1);

  const video = db.prepare('SELECT * FROM studio_videos WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ video });
}

export function updateStudioVideo(req, res) {
  const video = db.prepare('SELECT * FROM studio_videos WHERE id = ?').get(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found.' });

  const { caption, tiktokUrl, isActive, sortOrder } = req.body;
  db.prepare(
    `UPDATE studio_videos SET
      caption = COALESCE(?, caption), tiktok_url = ?, is_active = ?, sort_order = COALESCE(?, sort_order)
     WHERE id = ?`
  ).run(
    caption !== undefined ? caption : video.caption,
    tiktokUrl !== undefined ? tiktokUrl : video.tiktok_url,
    isActive !== undefined ? (isActive ? 1 : 0) : video.is_active,
    sortOrder !== undefined ? sortOrder : null,
    video.id
  );

  const fresh = db.prepare('SELECT * FROM studio_videos WHERE id = ?').get(video.id);
  res.json({ video: fresh });
}

export function deleteStudioVideo(req, res) {
  const video = db.prepare('SELECT * FROM studio_videos WHERE id = ?').get(req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found.' });
  unlinkQuiet(video.video_url);
  db.prepare('DELETE FROM studio_videos WHERE id = ?').run(video.id);
  res.json({ message: 'Video deleted.' });
}
