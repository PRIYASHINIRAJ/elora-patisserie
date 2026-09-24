import db from '../database/db.js';
import { publicUrlFor } from '../middleware/upload.js';

function ensureConversationForRequest(request) {
  if (request.conversation_id) return request.conversation_id;

  const info = db
    .prepare(
      `INSERT INTO conversations (user_id, subject, status, related_custom_request_id)
       VALUES (?, ?, 'new', ?)`
    )
    .run(request.user_id || null, `Custom Request — ${request.occasion || 'Cake'} (${request.full_name})`, request.id);

  db.prepare('UPDATE custom_requests SET conversation_id = ? WHERE id = ?').run(info.lastInsertRowid, request.id);
  return info.lastInsertRowid;
}

function attachExtras(request) {
  const images = db.prepare('SELECT * FROM custom_request_images WHERE custom_request_id = ?').all(request.id);
  return { ...request, images };
}

export function createCustomRequest(req, res) {
  const {
    fullName, email, phone, occasion, budgetRange, guestCount, preferredDate,
    description, colour, size, flavour, notes,
  } = req.body;

  if (!fullName || !email || !description) {
    return res.status(400).json({ error: 'Name, email, and a description of your vision are required.' });
  }

  const info = db
    .prepare(
      `INSERT INTO custom_requests
       (user_id, full_name, email, phone, occasion, budget_range, guest_count, preferred_date, description,
        colour, size, flavour, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user?.id || null, fullName, email, phone || null, occasion || null, budgetRange || null,
      guestCount || null, preferredDate || null, description,
      colour || null, size || null, flavour || null, notes || null
    );

  const requestId = info.lastInsertRowid;

  if (req.files?.length) {
    const insertImage = db.prepare('INSERT INTO custom_request_images (custom_request_id, url) VALUES (?, ?)');
    req.files.forEach((f) => insertImage.run(requestId, publicUrlFor('custom-requests', f.filename)));
  }

  // Open a conversation thread for this request immediately, seeded with the description.
  const request = db.prepare('SELECT * FROM custom_requests WHERE id = ?').get(requestId);
  const conversationId = ensureConversationForRequest(request);
  db.prepare(
    `INSERT INTO messages (conversation_id, sender_type, sender_id, body) VALUES (?, 'customer', ?, ?)`
  ).run(conversationId, req.user?.id || null, description);

  db.prepare(
    `INSERT INTO notifications (recipient_type, type, title, body, link)
     VALUES ('admin', 'custom_request', 'New custom cake request', ?, '/admin/custom-requests')`
  ).run(`${fullName} submitted a request for ${occasion || 'an occasion'}.`);

  res.status(201).json({ id: requestId, conversationId, message: 'Request received.' });
}

export function listCustomRequests(req, res) {
  const requests = db.prepare('SELECT * FROM custom_requests ORDER BY created_at DESC').all();
  res.json({ requests: requests.map(attachExtras) });
}

export function getCustomRequest(req, res) {
  const request = db.prepare('SELECT * FROM custom_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });

  // Ownership check for customer access
  if (req.user && request.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to view this request.' });
  }

  const messages = request.conversation_id
    ? db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(request.conversation_id)
    : [];

  res.json({ request: attachExtras(request), messages });
}

export function listMyCustomRequests(req, res) {
  const requests = db
    .prepare('SELECT * FROM custom_requests WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json({ requests: requests.map(attachExtras) });
}

export function sendQuote(req, res) {
  const { proposedPrice, proposedDesignNotes, message } = req.body;
  const request = db.prepare('SELECT * FROM custom_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });

  db.prepare(
    `UPDATE custom_requests SET status = 'quoted', quoted_price = ?, quoted_message = ?, quoted_design_notes = ?,
     updated_at = datetime('now') WHERE id = ?`
  ).run(proposedPrice || null, message || null, proposedDesignNotes || null, request.id);

  const conversationId = ensureConversationForRequest(request);
  const quoteSummary = `Quote: RM ${Number(proposedPrice || 0).toFixed(2)}${message ? ` — ${message}` : ''}`;
  db.prepare(`INSERT INTO messages (conversation_id, sender_type, sender_id, body) VALUES (?, 'admin', ?, ?)`)
    .run(conversationId, req.admin.id, quoteSummary);
  db.prepare(`UPDATE conversations SET status = 'replied', last_message_at = datetime('now') WHERE id = ?`).run(conversationId);

  db.prepare(
    `INSERT INTO notifications (recipient_type, recipient_id, type, title, body, link)
     VALUES ('customer', ?, 'quote', 'Your quote is ready', ?, '/orders')`
  ).run(request.user_id || null, quoteSummary);

  res.json({ message: 'Quote sent.' });
}

export function sendAdminMessage(req, res) {
  const { message } = req.body;
  const request = db.prepare('SELECT * FROM custom_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  if (!message) return res.status(400).json({ error: 'Message body is required.' });

  const conversationId = ensureConversationForRequest(request);
  db.prepare(`INSERT INTO messages (conversation_id, sender_type, sender_id, body) VALUES (?, 'admin', ?, ?)`)
    .run(conversationId, req.admin.id, message);
  db.prepare(`UPDATE conversations SET status = 'replied', last_message_at = datetime('now') WHERE id = ?`).run(conversationId);

  if (request.status === 'new') {
    db.prepare("UPDATE custom_requests SET status = 'reviewing', updated_at = datetime('now') WHERE id = ?").run(request.id);
  }

  res.json({ message: 'Message sent.' });
}

export function respondToQuote(req, res) {
  const { action, message } = req.body; // action: 'accept' | 'changes'
  const request = db.prepare('SELECT * FROM custom_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  if (req.user && request.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to respond to this request.' });
  }

  const newStatus = action === 'accept' ? 'accepted' : 'reviewing';
  db.prepare("UPDATE custom_requests SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, request.id);

  const conversationId = ensureConversationForRequest(request);
  const body = action === 'accept' ? 'The quote has been accepted.' : message || 'Requesting changes to the quote.';
  db.prepare(`INSERT INTO messages (conversation_id, sender_type, sender_id, body) VALUES (?, 'customer', ?, ?)`)
    .run(conversationId, req.user?.id || null, body);
  db.prepare(`UPDATE conversations SET status = 'new', last_message_at = datetime('now') WHERE id = ?`).run(conversationId);

  db.prepare(
    `INSERT INTO notifications (recipient_type, type, title, body, link)
     VALUES ('admin', 'custom_request', ?, ?, '/admin/custom-requests')`
  ).run(action === 'accept' ? 'Quote accepted' : 'Changes requested', `${request.full_name}: ${body}`);

  res.json({ message: newStatus === 'accepted' ? 'Quote accepted.' : 'Changes requested.' });
}

export function convertToOrder(req, res) {
  const request = db.prepare('SELECT * FROM custom_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });
  if (request.status !== 'accepted') {
    return res.status(400).json({ error: 'Only accepted requests can be converted into an order.' });
  }
  if (request.converted_order_id) {
    return res.status(400).json({ error: 'This request has already been converted into an order.' });
  }

  const orderNumber = `ELR-${Date.now().toString().slice(-8)}`;
  const price = request.quoted_price || 0;

  const orderInfo = db
    .prepare(
      `INSERT INTO orders (order_number, user_id, status, delivery_date, subtotal, total, notes)
       VALUES (?, ?, 'confirmed', ?, ?, ?, ?)`
    )
    .run(orderNumber, request.user_id || null, request.preferred_date || null, price, price, `Converted from custom request #${request.id}`);

  const orderId = orderInfo.lastInsertRowid;

  db.prepare(
    `INSERT INTO order_items (order_id, cake_name, quantity, unit_price) VALUES (?, ?, 1, ?)`
  ).run(orderId, `Custom Cake — ${request.occasion || 'Bespoke'}`, price);

  db.prepare("UPDATE custom_requests SET status = 'converted', converted_order_id = ? WHERE id = ?").run(orderId, request.id);

  res.json({ message: 'Converted to order.', orderId, orderNumber });
}
