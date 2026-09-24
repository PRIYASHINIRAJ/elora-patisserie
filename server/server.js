import app from './app.js';

// Debug listeners to catch silent boot crashes
process.on('uncaughtException', (err) => {
  console.error('❌ CRITICAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ CRITICAL UNHANDLED REJECTION:', reason);
});

// Local development server. On Vercel, api/index.js serves the same app.
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✨ Élora Patisserie API running on http://localhost:${PORT}`);
});
