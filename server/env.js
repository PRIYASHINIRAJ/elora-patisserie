// Loads server/.env regardless of the directory the process was started from.
// (On Vercel there is no .env file; settings come from project env vars.)
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env'), quiet: true });
