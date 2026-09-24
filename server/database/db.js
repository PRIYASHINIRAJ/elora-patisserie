import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || './database/elora.sqlite');

// Ensure database directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// SCHEMA — every table required by the Day 1 spec, with real relationships.
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  base_price REAL NOT NULL DEFAULT 0,
  serves TEXT,
  is_customizable INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft | published | archived
  catalog_number TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cake_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cake_id INTEGER NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cake_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cake_id INTEGER NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  occasion TEXT,
  featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT,
  recipient_name TEXT,
  phone TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'Malaysia',
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- pending | confirmed | in_progress | out_for_delivery | completed | cancelled
  delivery_type TEXT DEFAULT 'delivery', -- delivery | pickup
  delivery_date TEXT,
  delivery_time_slot TEXT,
  address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
  subtotal REAL DEFAULT 0,
  delivery_fee REAL DEFAULT 0,
  total REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  cake_id INTEGER REFERENCES cakes(id) ON DELETE SET NULL,
  cake_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price REAL NOT NULL,
  customization_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
  size TEXT,
  flavor TEXT,
  filling TEXT,
  frosting_color TEXT,
  topper_text TEXT,
  message_on_cake TEXT,
  reference_image_url TEXT,
  extra_notes TEXT,
  extra_cost REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custom_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  occasion TEXT,
  budget_range TEXT,
  guest_count TEXT,
  preferred_date TEXT,
  description TEXT,
  reference_image_url TEXT,
  status TEXT DEFAULT 'new', -- new | reviewing | quoted | accepted | declined
  admin_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT DEFAULT 'open', -- open | closed
  last_message_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- customer | admin
  sender_id INTEGER,
  body TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'stripe',
  provider_payment_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'MYR',
  status TEXT DEFAULT 'pending', -- pending | succeeded | failed | refunded
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_type TEXT NOT NULL, -- admin | customer
  recipient_id INTEGER,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read INTEGER DEFAULT 0,
  link TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS business_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT
);

CREATE TABLE IF NOT EXISTS favourites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cake_id INTEGER NOT NULL REFERENCES cakes(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, cake_id)
);

CREATE TABLE IF NOT EXISTS portfolio_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portfolio_id INTEGER NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS portfolio_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portfolio_id INTEGER NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- image | video
  original_name TEXT,
  size_bytes INTEGER,
  attached_to_type TEXT, -- cake | portfolio | null
  attached_to_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cakes_status ON cakes(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
`);

// ---------------------------------------------------------------------------
// MIGRATIONS — additive columns for Day 2 (Cake CMS + Portfolio CMS).
// Idempotent: checks PRAGMA table_info before altering.
// ---------------------------------------------------------------------------
function columnExists(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

function addColumn(table, column, definition) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Cake CMS fields
addColumn('cakes', 'flavour', 'TEXT');
addColumn('cakes', 'filling', 'TEXT');
addColumn('cakes', 'sizes', "TEXT DEFAULT '[]'"); // JSON array of {label, price}
addColumn('cakes', 'ingredients', "TEXT DEFAULT '[]'"); // JSON array of strings
addColumn('cakes', 'colours', "TEXT DEFAULT '[]'"); // JSON array of strings (hex or names)
addColumn('cakes', 'customization_options', "TEXT DEFAULT '[]'"); // JSON array of strings
addColumn('cakes', 'tags', "TEXT DEFAULT '[]'"); // JSON array of strings
addColumn('cakes', 'is_available', 'INTEGER DEFAULT 1');

// Portfolio CMS fields
addColumn('portfolio_items', 'portfolio_type', "TEXT DEFAULT 'portfolio_only'"); // portfolio_only | available_for_purchase
addColumn('portfolio_items', 'linked_cake_id', 'INTEGER REFERENCES cakes(id) ON DELETE SET NULL');
addColumn('portfolio_items', 'event_date', 'TEXT');
addColumn('portfolio_items', 'tags', "TEXT DEFAULT '[]'");
addColumn('portfolio_items', 'category', 'TEXT');
addColumn('portfolio_items', 'updated_at', "TEXT DEFAULT (datetime('now'))");

// Day 3 — custom request enhancements (colour/size/flavour/notes + quoting)
addColumn('custom_requests', 'colour', 'TEXT');
addColumn('custom_requests', 'size', 'TEXT');
addColumn('custom_requests', 'flavour', 'TEXT');
addColumn('custom_requests', 'notes', 'TEXT');
addColumn('custom_requests', 'quoted_price', 'REAL');
addColumn('custom_requests', 'quoted_message', 'TEXT');
addColumn('custom_requests', 'quoted_design_notes', 'TEXT');
addColumn('custom_requests', 'conversation_id', 'INTEGER REFERENCES conversations(id) ON DELETE SET NULL');
addColumn('custom_requests', 'converted_order_id', 'INTEGER REFERENCES orders(id) ON DELETE SET NULL');

// Day 3 — messaging enhancements
addColumn('conversations', 'related_cake_id', 'INTEGER REFERENCES cakes(id) ON DELETE SET NULL');
addColumn('conversations', 'related_custom_request_id', 'INTEGER REFERENCES custom_requests(id) ON DELETE SET NULL');
addColumn('conversations', 'related_order_id', 'INTEGER REFERENCES orders(id) ON DELETE SET NULL');
addColumn('messages', 'image_url', 'TEXT');

db.exec(`
CREATE TABLE IF NOT EXISTS custom_request_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_request_id INTEGER NOT NULL REFERENCES custom_requests(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);
`);

// Day 4 — full customization fidelity on order line items + payment/order lifecycle
addColumn('customizations', 'font', 'TEXT');
addColumn('customizations', 'message_placement', 'TEXT');
addColumn('customizations', 'occasion', 'TEXT');
addColumn('customizations', 'occasion_fields', "TEXT DEFAULT '{}'");
addColumn('customizations', 'decorations', "TEXT DEFAULT '[]'");
addColumn('customizations', 'order_type', 'TEXT');

addColumn('orders', 'customer_name', 'TEXT');
addColumn('orders', 'customer_email', 'TEXT');
addColumn('orders', 'customer_phone', 'TEXT');
addColumn('orders', 'payment_status', "TEXT DEFAULT 'unpaid'"); // unpaid | processing | paid | failed | refunded
addColumn('orders', 'stripe_checkout_session_id', 'TEXT');

addColumn('payments', 'stripe_session_id', 'TEXT');
addColumn('payments', 'method', 'TEXT'); // card | fpx | etc, populated from Stripe's response
addColumn('payments', 'raw_event_id', 'TEXT'); // Stripe event id, for idempotency

// Day 5 — admin order notes, customer account status, richer business settings
addColumn('orders', 'admin_notes', 'TEXT');
addColumn('users', 'account_status', "TEXT DEFAULT 'active'"); // active | blocked

db.exec(`
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(stripe_checkout_session_id);

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS studio_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_url TEXT NOT NULL,
  caption TEXT,
  tiktok_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Day 7 — "Meet the Baker" homepage section (admin-editable, nothing hardcoded)
const bakerDefaults = [
  ['baker_name', ''],
  ['baker_title', ''],
  ['baker_bio', ''],
  ['baker_photo_url', ''],
];
const insertSettingIfMissing = db.prepare(
  `INSERT INTO business_settings (key, value) VALUES (?, ?)
   ON CONFLICT(key) DO NOTHING`
);
bakerDefaults.forEach(([key, value]) => insertSettingIfMissing.run(key, value));

export default db;
