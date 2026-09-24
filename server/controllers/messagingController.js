import db from '../database/db.js';
import { publicUrlFor } from '../middleware/upload.js';

function attachContext(conv) {
  const cake = conv.related_cake_id
    ? db.prepare('SELECT id, name, slug FROM cakes WHERE id = ?').get(conv.related_cake_id)
    : null;
  const order = conv.related_order_id
    ? db.prepare('SELECT id, order_number FROM orders WHERE id = ?').get(conv.related_order_id)
    : null;
  const customer = conv.user_id
    ? db.prepare('SELECT id, full_name, email FROM users WHERE id = ?').get(conv.user_id)
    : null;
  return { ...conv, cake, order, customer };
}

// ---- Customer-facing ----

export function listMyConversations(req, res) {
  const conversations = db
    .prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY last_message_at DESC')
    .all(req.user.id);
  res.json({ conversations: conversations.map(attachContext) });
}

export function createConversation(req, res) {
  const { subject, relatedCakeId, body } = req.body;
  if (!body) return res.status(400).json({ error: 'Message body is required.' });

  const info = db
    .prepare(
      `INSERT INTO conversations (user_id, subject, status, related_cake_id) VALUES (?, ?, 'new', ?)`
    )
    .run(req.user.id, subject || 'General Enquiry', relatedCakeId || null);

  db.prepare(`INSERT INTO messages (conversation_id, sender_type, sender_id, body, image_url) VALUES (?, 'customer', ?, ?, ?)`)
    .run(info.lastInsertRowid, req.user.id, body, req.file ? publicUrlFor('messages', req.file.filename) : null);

  const customer = db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id);
  db.prepare(
    `INSERT INTO notifications (recipient_type, type, title, body, link)
     VALUES ('admin', 'message', 'New customer message', ?, '/admin/messages')`
  ).run(`${customer?.full_name || 'A customer'} started a new conversation.`);

  res.status(201).json({ conversationId: info.lastInsertRowid });
}

export function getMyConversation(req, res) {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conv.id);
  db.prepare("UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = 'admin'").run(conv.id);

  res.json({ conversation: attachContext(conv), messages });
}

export function replyAsCustomer(req, res) {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
  const { body } = req.body;
  if (!body && !req.file) return res.status(400).json({ error: 'Message body or image is required.' });

  db.prepare(`INSERT INTO messages (conversation_id, sender_type, sender_id, body, image_url) VALUES (?, 'customer', ?, ?, ?)`)
    .run(conv.id, req.user.id, body || '', req.file ? publicUrlFor('messages', req.file.filename) : null);
  db.prepare(`UPDATE conversations SET status = 'new', last_message_at = datetime('now') WHERE id = ?`).run(conv.id);

  db.prepare(
    `INSERT INTO notifications (recipient_type, type, title, body, link)
     VALUES ('admin', 'message', 'New reply', ?, '/admin/messages')`
  ).run(`${db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id)?.full_name || 'A customer'} replied to a conversation.`);

  res.status(201).json({ message: 'Sent.' });
}

// ---- Admin-facing ----

export function listAllConversations(req, res) {
  const { status } = req.query;
  let query = 'SELECT * FROM conversations';
  const params = [];
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY last_message_at DESC';
  const conversations = db.prepare(query).all(...params);
  res.json({ conversations: conversations.map(attachContext) });
}

export function getConversationAdmin(req, res) {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conv.id);
  db.prepare("UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = 'customer'").run(conv.id);

  res.json({ conversation: attachContext(conv), messages });
}

export function replyAsAdmin(req, res) {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });
  const { body } = req.body;
  if (!body && !req.file) return res.status(400).json({ error: 'Message body or image is required.' });

  db.prepare(`INSERT INTO messages (conversation_id, sender_type, sender_id, body, image_url) VALUES (?, 'admin', ?, ?, ?)`)
    .run(conv.id, req.admin.id, body || '', req.file ? publicUrlFor('messages', req.file.filename) : null);
  db.prepare(`UPDATE conversations SET status = 'replied', last_message_at = datetime('now') WHERE id = ?`).run(conv.id);

  if (conv.user_id) {
    db.prepare(
      `INSERT INTO notifications (recipient_type, recipient_id, type, title, body, link)
       VALUES ('customer', ?, 'message', 'Élora replied', ?, '/messages')`
    ).run(conv.user_id, body ? body.slice(0, 100) : 'You have a new message from Élora.');
  }

  res.status(201).json({ message: 'Sent.' });
}

export function setConversationStatus(req, res) {
  const { status } = req.body; // new | in_progress | replied | completed
  if (!['new', 'in_progress', 'replied', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  db.prepare('UPDATE conversations SET status = ? WHERE id = ?').run(status, conv.id);
  res.json({ message: 'Status updated.' });
}

// Used by the admin order detail page's "Contact Customer" action — finds or
// creates a conversation tied to this order and posts the admin's message.
export function adminContactCustomerForOrder(req, res) {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required.' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  let conv = db.prepare('SELECT * FROM conversations WHERE related_order_id = ?').get(order.id);
  if (!conv) {
    const info = db
      .prepare(`INSERT INTO conversations (user_id, subject, status, related_order_id) VALUES (?, ?, 'replied', ?)`)
      .run(order.user_id || null, `Order ${order.order_number}`, order.id);
    conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(info.lastInsertRowid);
  }

  db.prepare(`INSERT INTO messages (conversation_id, sender_type, sender_id, body) VALUES (?, 'admin', ?, ?)`)
    .run(conv.id, req.admin.id, message);
  db.prepare(`UPDATE conversations SET status = 'replied', last_message_at = datetime('now') WHERE id = ?`).run(conv.id);

  res.status(201).json({ message: 'Sent.', conversationId: conv.id });
}
