# Élora Patisserie — Full-Stack Luxury Cake Business Platform

**"Made for moments worth remembering."**

## Bug-fix round (real browser testing found and fixed real bugs)

This round finally had access to an actual browser (Playwright/Chromium) instead of only
API-level testing, and it immediately paid off — it caught bugs that curl-based testing
structurally could not:

- **Fixed: cake detail page was a blank white screen.** Root cause: when the page was
  split into two components (`CakeDetail` / `CakeDetailContent`) for the SEO-meta hook,
  `user`, `isFavourite`, and `toggleFavourite` stayed referenced in the child component
  without being passed down as props — an uncaught `ReferenceError` that crashes the whole
  React tree with no error boundary. Reproduced the exact error in a real browser console,
  fixed it, then re-verified the page renders correctly.
- **Fixed: uploaded images/videos silently 404'd in local dev.** The Vite dev server had
  no proxy for `/uploads/...`, so requests for admin-uploaded media resolved against the
  frontend's own origin (port 5173) and silently fell back to serving `index.html`
  (`Content-Type: text/html`) instead of the actual file — a bug that curl-testing the API
  directly (always against port 4000) could never have surfaced. Added a dev-server proxy
  forwarding `/uploads` to the API. **This matters in production too**: whatever serves the
  built frontend (`dist/`) must also forward `/uploads/*` (and ideally `/api/*`) to the
  Node server — e.g. an Nginx/Caddy reverse proxy in front of both, or serving them from
  the same origin. Without that, uploaded media will 404 in production exactly like it did
  in dev.
- **Removed the cinematic page-transition overlay** per explicit feedback that it read as
  an unwanted loading flash rather than a nice effect.
- **Rebuilt the homepage's horizontal cake gallery** with visible previous/next arrow
  buttons and a progress indicator, instead of relying on undiscoverable drag-only
  interaction.
- **Added a "From the Studio" reels section**: admin uploads short vertical videos (with
  an optional caption and a link back to the original TikTok post) through a new Studio
  Reels admin page; they autoplay muted/looped in a homepage carousel. Real file upload,
  not an embed — verified end-to-end including that the section correctly stays hidden
  until at least one video exists.
- **Added a "Meet the Baker" section**: name, title, bio, and photo are all managed from
  Admin Settings (nothing hardcoded); the section only renders once a name and photo are
  actually set, rather than showing empty placeholder content.
- Cleaned up stale debug artifacts (an unrelated, out-of-date root `package.json` from an
  earlier prototype, ad-hoc test scripts, a stray cookie file) that had accumulated outside
  the real `client/`/`server/` structure.

### Honest caveat on video playback
The headless Chromium available in this environment couldn't decode either video file
(`DEMUXER_ERROR_NO_SUPPORTED_STREAMS`) despite both using standard H.264 — this looks like
a codec-support limitation of this specific sandboxed browser build, not a site bug (the
files serve correctly over HTTP with correct headers, and standard H.264 is supported by
virtually every real desktop/mobile browser). I can't personally verify video playback
pixel-for-pixel in this environment; worth a quick manual check once you run it locally.

---

## Post-Day-6 responsive follow-up

A closer responsive pass on the admin panel found and fixed a real "shrink desktop"
violation: the admin sidebar was a fixed 256px `<aside>` always rendered, which on a
375px mobile screen left almost no room for content. Rebuilt it as a proper off-canvas
mobile nav — hamburger menu, slide-in drawer with backdrop, sticky mobile top bar showing
the current section and notifications — while the desktop layout is untouched at `lg+`.

Also found and fixed several list-row layouts (Admin Orders, Admin Customers, Admin
Messages conversation header) that packed multiple fixed-width elements into a single
non-wrapping flex row — a classic horizontal-scrollbar bug on narrow viewports. Fixed by
stacking those rows vertically on mobile and only going horizontal at `sm:`/`lg:`, with
`min-w-0`/`truncate` on text and `shrink-0`/`flex-wrap` on badges and actions so nothing
forces the page wider than the viewport.

Re-ran the full spec's database-flow diagram end-to-end as one continuous test — admin
uploads a featured cake → appears on the customer site → customer registers, customizes,
and orders it → order lands in the admin dashboard → admin confirms it → customer sees
the status change and receives both the "Order received" and "Order confirmed"
notifications. All verified via real HTTP requests, then cleaned up.

---

## Day 6 additions (on top of Days 1–5) — final integration, security, polish

This was explicitly *not* a new-features day — it was about proving the whole system
actually works together, and hardening it. Testing found and fixed two real bugs:

- **Critical fix — price tampering**: order creation was trusting client-supplied prices
  with zero server-side validation. I proved this was exploitable (successfully ordered
  an RM880 cake for RM160 in testing), then fixed it: the server now independently
  resolves the real price from the cake record (plus any admin-configured size surcharge)
  and ignores whatever the client sends. Re-tested the exact same exploit afterward —
  correctly blocked.
- **Fix — file validation error handling**: rejected uploads (wrong file type) were
  returning an unhelpful 500 instead of a clean 400. Fixed the error handler to catch
  Multer/file-type errors and return a clear message.
- **Fix — Contact page** was hardcoding the WhatsApp number/email/address (a violation of
  Day 5's own "nothing hardcoded" rule) and had no real form despite this day's brief
  requiring one. Rebuilt it to pull from Admin Settings and added a working contact form
  backed by a real endpoint that lands in the admin message inbox.
- **Security hardening**: rate limiting added to login/register (customer and admin),
  verified it actually triggers after the threshold without blocking legitimate use;
  added proper `.env.example` files for both client and server.
- **Full end-to-end journeys verified via real API calls** (not just code review):
  the complete purchase path (register → browse → customize → order → correct
  server-computed pricing) and the complete custom-cake path (request with images →
  admin receives → replies → quotes → customer accepts → converted to a real order at
  the quoted price).
- **Admin CMS → customer chain re-verified** after all changes: publish, edit, delete for
  both cakes and portfolio, each step checked from the customer's point of view.
- **Auth boundaries re-verified**: unauthenticated access blocked everywhere, cross-customer
  order access blocked, admin/customer session confusion blocked.
- **Performance**: converted every admin page to a lazy-loaded, code-split chunk — the
  customer-facing bundle no longer pays for `recharts` or any admin-only code. Verified
  with a real build: main bundle dropped from ~1000KB to ~499KB, with the heaviest admin
  chunk (380KB, mostly recharts) now loaded only when an admin actually visits the
  dashboard. Added `loading="lazy"` to all below-the-fold images.
- **Accessibility**: added a real SEO/meta setup (was a bare `<title>client</title>`
  before) with per-page titles and descriptions across the main customer pages; added
  visible focus-visible states site-wide (previously nothing on keyboard focus); added
  `aria-label`s to icon-only cart/quantity/close/favourite buttons; wired
  `prefers-reduced-motion` into the two most intense JS-driven animations (hero parallax
  and the page-transition curtain), not just the CSS-level rule from Day 2.

### Honest gaps after Day 6
I did not get to a systematic device-by-device responsive audit (relying instead on the
Tailwind responsive classes already used consistently since Day 1) or a full accessibility
audit of every admin screen (the icon-only buttons there mostly use `title` attributes
rather than `aria-label`, which is weaker but not absent). No browser was available in
this environment to visually confirm rendering at each breakpoint — see the Day 2 note
about Puppeteer/Chrome being unreachable here.

---

## Day 5 additions (on top of Days 1–4) — professional platform layer

- **Enhanced admin dashboard**: revenue (paid orders only, distinct from gross sales),
  full order status breakdown (pending/confirmed/preparing/ready/out-for-delivery/
  completed/cancelled), a 14-day revenue trend line chart and a popular-cakes bar chart
  (recharts), recent orders and enquiries — all tested with real data end-to-end.
- **Admin order management**: search by order number/customer name/email, filter by
  status, per-order admin notes, "Contact Customer" (creates/reuses a conversation tied
  to that order and posts a message) — all verified via the API.
- **Admin customer management**: every customer with order count, total spend (from paid
  orders only), custom request count, conversation count, and the ability to block/
  unblock an account — verified a blocked account is correctly rejected at login.
- **Customer account expansion**: Favourites (add/remove from any cake), Addresses
  (full CRUD with a default address), notification bell with unread badge and dropdown.
- **In-app notifications**, both directions — customer (order received, payment
  successful, order confirmed/preparing/ready/out-for-delivery/completed, admin replied,
  quote received) and admin (new order, new payment, new custom request, new message,
  cancelled order). Verified the pipeline actually fires on real actions, not just that
  the code compiles.
- **Admin settings, fully expanded and still nothing hardcoded**: business name, logo
  (real file upload), description, WhatsApp/Instagram/TikTok/Facebook, address, opening
  hours, delivery fee, and minimum order. Delivery fee and minimum order are read from
  the database at checkout time — verified an order below the configured minimum is
  correctly rejected with a clear error.
- **Advanced animation layer**: scroll-triggered reveals and parallax (built in Day 2,
  extended here), a custom cursor (desktop-only, disabled on touch/coarse pointers via
  a `hover:hover` media query — small circle by default, "VIEW" over images, "EXPLORE"
  over cake cards, subtle expansion over buttons), magnetic buttons on primary CTAs, and
  a cinematic ivory curtain page transition (expand → slide off → reveal) timed to stay
  under ~650ms total so it never feels sluggish.
- **3D cake**: no real 3D asset exists, so per the brief's own fallback instruction, the
  cake customizer's layered CSS preview (built in Day 3) serves this role rather than
  faking cheap 3D — it already reacts live to size, colour, and message changes.

---

## Day 4 additions (on top of Days 1–3) — real commerce

- **Cart drawer**: animated right-side panel on desktop, full-screen on mobile (one
  responsive component, not two implementations). Add, change quantity, remove, subtotal —
  persists across reloads via localStorage. Opens automatically on add-to-cart.
- **Premium checkout**: Customer / Delivery (address or studio pickup) / Order Review
  sections, with delivery fee computed server-side (never trusted from the client).
- **Real Stripe integration** — not a fake payment screen. Backend creates genuine Stripe
  Checkout Sessions (cards + FPX) via the official `stripe` npm package; the browser is
  redirected to Stripe's own hosted, PCI-compliant checkout page. This server **never**
  touches raw card numbers, CVVs, or payment credentials — Stripe's hosted page handles all
  of that. Configuration lives entirely in `server/.env` (`STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`) — nothing is hardcoded, and if those are left blank the checkout
  endpoint returns a clear, honest "payment gateway not configured" message instead of
  pretending to process a payment.
- **Webhook-confirmed order lifecycle**: `POST /api/webhooks/stripe` verifies Stripe's
  signature on the raw request body, then — and only then — marks the order paid, records
  the payment, and notifies admin. I verified this really works, without needing a live
  Stripe account: using Stripe SDK's own local test-signing utility (pure cryptography, no
  network call), I generated a validly-signed `checkout.session.completed` event and sent
  it to the real endpoint — the order flipped from `unpaid/pending` to `paid/confirmed`,
  a payment record was created with the correct amount, **a tampered signature was
  correctly rejected**, and **a replayed event was correctly ignored** (idempotent). See
  the build conversation for the exact commands.
- **Failed/retry payment**: if payment fails or is cancelled, the order is never marked
  paid; the order page shows a clear failure state with a real **Retry Payment** button
  that starts a fresh Checkout Session for the same order.
- **Full order database**: customer contact info, delivery details, per-item customization
  (size/flavour/filling/colour/message/font/placement/occasion/decorations/notes), payment
  records, and status — all persisted with real relationships, verified end-to-end with a
  fully customized cake order.
- **Order status lifecycle**: admin can move orders through
  Pending → Confirmed → Preparing → Ready → Out for Delivery → Completed, or Cancelled —
  each transition tested via the API and confirmed visible to the customer immediately.
- **Order confirmation page**: order number, items, customization, delivery details,
  payment status, with View Order / Contact Élora actions; polls briefly after a Stripe
  redirect in case the webhook lands a moment later than the browser redirect.

### Honest limitation
I don't have a real Stripe account or API keys, and can't create one autonomously (Stripe
requires interactive signup/verification). I *can* reach Stripe's real servers from this
environment (confirmed via a genuine TLS handshake to `api.stripe.com`), so the Checkout
Session creation code is written correctly against Stripe's actual API — but I could not
personally exercise a live, end-to-end charge. To go live: add your Stripe secret key,
publishable key, and webhook signing secret to `server/.env`, point a webhook endpoint at
`/api/webhooks/stripe` in the Stripe Dashboard, and it should work as built. FPX is
enabled in the code since it's commonly used in Malaysia; DuitNow QR and Touch 'n Go
eWallet are not supported by Stripe directly and would need a Malaysia-specific gateway
(e.g. Billplz or Curlec) if you want those specific rails.

---

## Day 3 additions (on top of Days 1–2)

- **Live cake customizer** on every cake detail page, with two real paths: "Order This
  Exact Design" (size, quantity, message, delivery date/time) and "Customize This Design"
  (size, flavour, filling, colour — preset palette + native picker + hex — message with
  font/colour/placement, occasion with dynamic fields per occasion type, decorations,
  other requirements). A layered CSS preview re-renders live as tiers, colour, and message
  placement change; the original photo always stays visible alongside it rather than
  pretending to edit the photo itself.
- **Create Your Cake** rebuilt with multi-image inspiration upload plus the full field set
  (colour, size, flavour, budget, required date, notes, occasion-specific details).
- **Custom request → quote → accept → order**, a complete real chain verified end-to-end:
  a submitted request (with photos) opens a conversation automatically; admin can send a
  priced quote or a plain message from the same screen; the customer can accept or request
  changes; an accepted request can be converted by admin into a genuine row in the orders
  table, immediately visible on the dashboard.
- **Customer ↔ admin messaging**, a real chat system (not a contact form): text + image
  attachments, timestamps, optional linkage to a specific cake, a customer-side thread view,
  and an admin inbox with New / In Progress / Replied / Completed status tracking.
- **Floating WhatsApp button** on every customer page, pulling a real number from Admin
  Settings (never hardcoded) and generating a contextual pre-filled message that updates
  live based on whatever the customer is currently customizing.
- **Admin Settings** page to edit the WhatsApp number and other business info in place.

Every flow above was verified with real HTTP requests end-to-end (request → images →
conversation → quote → accept → real order in the dashboard; message → admin inbox →
reply → customer sees it), not just written and assumed to work.

---

## Day 2 additions (on top of Day 1's foundation)

- **Cinematic homepage** — full-screen ÉLORA / PATISSERIE loading sequence with a real
  progress line (no spinner), a parallax hero with floating particles, staggered text
  reveal, and a transparent navbar that blurs and shrinks on scroll. 12 content sections
  (brand intro, featured cakes, a drag-to-explore horizontal gallery, signature cake
  spotlight, portfolio showcase, custom-cake CTA, wedding section, craftsmanship, client
  testimonials, social gallery, newsletter) all animate in with Framer Motion.
- **Admin Cake CMS** — create/edit cakes with main image, gallery images, and video upload;
  flavour, filling, sizes (with per-size pricing), ingredients, colours, customization
  options, tags, featured/available toggles; Publish / Save Draft / Archive / Delete all
  wired to the database. Verified: a draft cake is invisible on the public site, and
  publishing it makes it appear immediately — no redeploy needed.
- **Portfolio CMS** — multi-photo/video upload per entry, category/occasion/date/tags,
  and a Portfolio Only vs. Available for Purchase toggle (the latter links to a real cake
  and shows a "View & Order" button on the customer-facing portfolio detail view).
- **Media Library** — upload, preview, delete, and attach any image/video to a cake or
  portfolio entry, all without touching code.
- **Newsletter** — the homepage signup section posts to a real endpoint and persists
  subscribers to the database.

Everything above was tested end-to-end with real HTTP requests (not just written and
assumed to work) — see the conversation for the exact verification steps.

---

This is Day 1 of a 6-day build: the complete application foundation. Frontend, backend,
database, authentication, routing, and the admin dashboard are all live and connected.

## What's working right now

- **Database** (SQLite, `server/database/elora.sqlite`): every table from the spec —
  users, admins, cakes, cake_images, cake_videos, portfolio_items, categories, orders,
  order_items, customizations, custom_requests, conversations, messages, payments,
  addresses, notifications, business_settings, favourites — with real foreign keys.
- **Auth**: customer register/login/logout/profile and a fully separate admin login,
  both with bcrypt password hashing and JWT sessions in httpOnly cookies.
  Visiting `/admin` while logged out redirects to `/admin/login`.
- **Admin dashboard**: pulls live stats (orders, sales, enquiries, unread messages,
  upcoming deliveries) straight from the database — not mock data.
- **Customer site**: home, collection (with real category filtering), cake detail,
  a working cart (add/remove/update quantity, persisted locally), custom cake request
  form (writes to the database and appears in the admin dashboard instantly),
  portfolio, our story, contact, login/register/account.
- **Every route in the spec resolves** — pages not yet fully built (order management,
  the cake CMS, messaging, media library) show an honest "coming in a later phase"
  placeholder rather than a fake, non-functional UI.

## Project structure

```
elora-patisserie/
├── client/     React + Vite + Tailwind v4 frontend
└── server/     Node + Express + SQLite backend
```

## Running it locally

**Backend:**
```bash
cd server
npm install
npm run seed   # creates the admin account + sample cakes (only needed once)
npm run dev    # http://localhost:4000
```

**Frontend** (in a second terminal):
```bash
cd client
npm install
npm run dev    # http://localhost:5173
```

### Default accounts

- **Admin login** (`/admin/login`): `admin@elorapatisserie.com` / `EloraAdmin123!`
  (set in `server/.env` — change before any real deployment)
- **Customers**: register your own via `/register`

## What's next (Days 2–6)

Cake CMS with image/video upload, portfolio management, order + payment gateway
integration, real-time admin/customer messaging, WhatsApp integration, notifications,
and the full cinematic homepage polish (GSAP/Three.js) layer on top of this foundation
without breaking what's already working.
