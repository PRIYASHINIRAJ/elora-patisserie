// Vercel Function entry: every /api/* request is rewritten here (see vercel.json)
// and handled by the same Express app that `npm run dev` serves locally.
import app from '../server/app.js';

export default app;
