// The Élora API, running entirely inside the visitor's browser. The same route
// and controller code a Node server would use is mounted here, and
// `handleRequest` answers the site's API calls (see services/api.js).
import { resolveFileUrl, FILE_PREFIX } from './storage.js';

import authRoutes from './routes/authRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import cakeRoutes from './routes/cakeRoutes.js';
import customRequestRoutes from './routes/customRequestRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import adminCakeRoutes from './routes/adminCakeRoutes.js';
import adminPortfolioRoutes from './routes/adminPortfolioRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import messagingRoutes from './routes/messagingRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import studioVideoRoutes from './routes/studioVideoRoutes.js';

// Longest prefixes first so /admin/cakes wins over /admin.
const mounts = [
  ['/auth', authRoutes],
  ['/admin/auth', adminAuthRoutes],
  ['/admin/dashboard', dashboardRoutes],
  ['/cakes', cakeRoutes],
  ['/custom-requests', customRequestRoutes],
  ['/portfolio', portfolioRoutes],
  ['/admin/cakes', adminCakeRoutes],
  ['/admin/portfolio', adminPortfolioRoutes],
  ['/admin/media', mediaRoutes],
  ['/newsletter', newsletterRoutes],
  ['/messages', messagingRoutes],
  ['/settings', settingsRoutes],
  ['/orders', orderRoutes],
  ['/admin/orders', adminOrderRoutes],
  ['/notifications', notificationRoutes],
  ['/admin/customers', customerRoutes],
  ['/favourites', favouriteRoutes],
  ['/addresses', addressRoutes],
  ['/contact', contactRoutes],
  ['/studio-videos', studioVideoRoutes],
].sort((a, b) => b[0].length - a[0].length);

// ---- Session cookies (kept in localStorage so logins survive a reload) ----
const COOKIE_KEY = 'elora_session';

function readCookies() {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeCookies(cookies) {
  try {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(cookies));
  } catch {
    // storage unavailable (private mode): the session lasts until reload
  }
}

// ---- Request body -------------------------------------------------------
function parseBody(data) {
  if (data instanceof FormData) {
    const body = {};
    const rawFiles = {};
    for (const [key, value] of data.entries()) {
      if (value instanceof Blob) {
        (rawFiles[key] ||= []).push(value);
      } else if (key in body) {
        body[key] = [].concat(body[key], value);
      } else {
        body[key] = value;
      }
    }
    return { body, rawFiles };
  }
  if (typeof data === 'string' && data) {
    try {
      return { body: JSON.parse(data), rawFiles: {} };
    } catch {
      return { body: {}, rawFiles: {} };
    }
  }
  return { body: data && typeof data === 'object' ? data : {}, rawFiles: {} };
}

// ---- Stored-file URLs → displayable object URLs ---------------------------
async function resolveFiles(value) {
  if (typeof value === 'string') return value.startsWith(FILE_PREFIX) ? resolveFileUrl(value) : value;
  if (Array.isArray(value)) return Promise.all(value.map(resolveFiles));
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await resolveFiles(v)]));
    return Object.fromEntries(entries);
  }
  return value;
}

function errorBody(err) {
  if (err?.status && err.status < 500) return { status: err.status, body: { error: err.publicMessage || err.message } };
  console.error('[élora api]', err);
  return { status: 500, body: { error: 'Something went wrong. Please try again.' } };
}

/**
 * Handles one API request. `path` is relative to /api (e.g. "/cakes?featured=true").
 * Resolves { status, data }.
 */
export async function handleRequest({ method, path, data }) {
  const url = new URL(path, 'http://elora.local');
  const cookies = readCookies();
  const { body, rawFiles } = parseBody(data);

  const req = {
    method: method.toUpperCase(),
    path: url.pathname,
    originalUrl: url.pathname + url.search,
    query: Object.fromEntries(url.searchParams),
    body,
    rawFiles,
    headers: {},
    cookies,
    params: {},
  };

  let status = 200;
  let payload;
  const res = {
    finished: false,
    status(code) {
      status = code;
      return this;
    },
    json(obj) {
      payload = obj;
      this.finished = true;
      return this;
    },
    cookie(name, value) {
      cookies[name] = value;
      writeCookies(cookies);
      return this;
    },
    clearCookie(name) {
      delete cookies[name];
      writeCookies(cookies);
      return this;
    },
  };

  try {
    let handled = false;
    for (const [prefix, router] of mounts) {
      if (req.path === prefix || req.path.startsWith(`${prefix}/`)) {
        const sub = req.path.slice(prefix.length) || '/';
        handled = await router.handle(req, res, sub);
        if (handled) break;
      }
    }
    if (!handled) {
      return { status: 404, data: { error: `Route not found: ${req.method} ${req.originalUrl}` } };
    }
  } catch (err) {
    const e = errorBody(err);
    return { status: e.status, data: e.body };
  }

  return { status, data: await resolveFiles(payload ?? {}) };
}
