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

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

export function register(req, res) {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const hash = bcrypt.hashSync(password, 12);
  const info = db
    .prepare('INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)')
    .run(fullName, email.toLowerCase(), phone || null, hash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken({ type: 'customer', id: user.id, email: user.email });

  res.cookie('elora_customer_token', token, COOKIE_OPTS);
  res.status(201).json({ user: sanitizeUser(user), token });
}

export function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  if (user.account_status === 'blocked') {
    return res.status(403).json({ error: 'This account has been suspended. Please contact us for help.' });
  }

  const token = signToken({ type: 'customer', id: user.id, email: user.email });
  res.cookie('elora_customer_token', token, COOKIE_OPTS);
  res.json({ user: sanitizeUser(user), token });
}

export function logout(req, res) {
  res.clearCookie('elora_customer_token', CLEAR_COOKIE_OPTS);
  res.json({ message: 'Logged out.' });
}

export function me(req, res) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: sanitizeUser(user) });
}

export function updateProfile(req, res) {
  const { fullName, phone } = req.body;
  db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = datetime(\'now\') WHERE id = ?')
    .run(fullName || null, phone || null, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: sanitizeUser(user) });
}
