import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Debug listeners to catch silent boot crashes
process.on('uncaughtException', (err) => {
  console.error('❌ CRITICAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ CRITICAL UNHANDLED REJECTION:', reason);
});

// Import database (runs initialization)
import './database/db.js';

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Behind Render's proxy: needed for correct client IPs in rate limiting.
app.set('trust proxy', 1);

// Ensure uploads folder exists before serving static files
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS Middleware
// CLIENT_URL may be a comma-separated list (e.g. production + custom domain).
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
app.use('/uploads', express.static(uploadsDir));

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

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Server Listener
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✨ Élora Patisserie API running on http://localhost:${PORT}`);
});