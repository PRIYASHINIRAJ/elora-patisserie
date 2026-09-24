import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { signToken } from '../utils/jwt.js';

// In production the site (Vercel) and API (Render) live on different domains,
// so the cookie must be SameSite=None (which in turn requires Secure).
const isProd = process.env.NODE_ENV === 'production';
const CLEAR_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
};
const COOKIE_OPTS = { ...CLEAR_COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 };

function sanitizeAdmin(admin) {
  const { password_hash, ...safe } = admin;
  return safe;
}

export function adminLogin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email.toLowerCase());
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const token = signToken({ type: 'admin', id: admin.id, email: admin.email, role: admin.role });
  res.cookie('elora_admin_token', token, COOKIE_OPTS);
  res.json({ admin: sanitizeAdmin(admin), token });
}

export function adminLogout(req, res) {
  res.clearCookie('elora_admin_token', CLEAR_COOKIE_OPTS);
  res.json({ message: 'Logged out.' });
}

export function adminMe(req, res) {
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found.' });
  res.json({ admin: sanitizeAdmin(admin) });
}
