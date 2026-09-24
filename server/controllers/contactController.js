import db from '../database/db.js';

export async function submitContactForm(req, res) {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const info = await db
    .prepare(`INSERT INTO conversations (user_id, subject, status) VALUES (NULL, ?, 'new')`)
    .run(`Contact form — ${name}`);

  await db.prepare(`INSERT INTO messages (conversation_id, sender_type, body) VALUES (?, 'customer', ?)`)
    .run(info.lastInsertRowid, `From: ${name} (${email})\n\n${message}`);

  await db.prepare(
    `INSERT INTO notifications (recipient_type, type, title, body, link)
     VALUES ('admin', 'message', 'New contact form message', ?, '/admin/messages')`
  ).run(`${name} (${email}) sent a message via the contact form.`);

  res.status(201).json({ message: "Message sent — we'll be in touch soon." });
}
