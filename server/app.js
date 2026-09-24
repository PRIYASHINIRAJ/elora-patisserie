import './env.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import db, { dbReady } from './database/db.js';
import { seed } from './database/seed.js';
import { uploadsRoot } from './middleware/upload.js';

// Import route modules
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
import webhookRoutes from './routes/webhookRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import studioVideoRoutes from './routes/studioVideoRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import blobUploadRoutes from './routes/blobUploadRoutes.js';

const app = express();

// Behind Vercel's proxy: needed for correct client IPs in rate limiting.
app.set('trust proxy', 1);

// Schema setup (and first-run seeding of an empty database) must finish
// before any request touches the database.
const ready = dbReady.then(async () => {
  const { n } = await db.prepare('SELECT COUNT(*) AS n FROM admins').get();
  if (!n) await seed();
});
app.use((req, res, next) => {
  ready.then(() => next(), next);
});

// CORS — only needed when the site and API run on different origins (local dev).
// CLIENT_URL may be a comma-separated list.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''));
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Webhooks (must be registered BEFORE express.json() for Stripe raw body verification)
app.use('/api/webhooks', webhookRoutes);

// Body Parsing & Core Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
// Locally uploaded files (development). In production uploads live in Vercel Blob.
app.use('/uploads', express.static(uploadsRoot));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'elora-patisserie-api', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/cakes', cakeRoutes);
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin/cakes', adminCakeRoutes);
app.use('/api/admin/portfolio', adminPortfolioRoutes);
app.use('/api/admin/media', mediaRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/customers', customerRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/studio-videos', studioVideoRoutes);
app.use('/api/uploads/blob', blobUploadRoutes);

// Serve the built website from the same server (single-process mode, used by
// `npm start` at the project root). On Vercel the site is served as static files.
const clientDist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist');
if (!process.env.VERCEL && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
