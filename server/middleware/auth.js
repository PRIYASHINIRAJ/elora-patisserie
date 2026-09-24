import { verifyToken } from '../utils/jwt.js';

const HEADER_FOR_COOKIE = {
  elora_customer_token: 'x-customer-token',
  elora_admin_token: 'x-admin-token',
};

function extractToken(req, cookieName) {
  const headerToken = req.headers[HEADER_FOR_COOKIE[cookieName]];
  if (headerToken) return headerToken;
  const bearer = req.headers.authorization;
  if (bearer && bearer.startsWith('Bearer ')) return bearer.slice(7);
  if (req.cookies && req.cookies[cookieName]) return req.cookies[cookieName];
  return null;
}

// Requires a valid customer session
export function requireCustomer(req, res, next) {
  const token = extractToken(req, 'elora_customer_token');
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }
  try {
    const payload = verifyToken(token);
    if (payload.type !== 'customer') {
      return res.status(403).json({ error: 'Invalid session type.' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// Requires a valid admin session
export function requireAdmin(req, res, next) {
  const token = extractToken(req, 'elora_admin_token');
  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }
  try {
    const payload = verifyToken(token);
    if (payload.type !== 'admin') {
      return res.status(403).json({ error: 'Invalid session type.' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Admin session expired. Please log in again.' });
  }
}

// Attaches req.user if a valid customer token is present, but does not block the request
export function optionalCustomer(req, res, next) {
  const token = extractToken(req, 'elora_customer_token');
  if (token) {
    try {
      const payload = verifyToken(token);
      if (payload.type === 'customer') req.user = payload;
    } catch {
      // ignore invalid/expired token for optional auth
    }
  }
  next();
}
