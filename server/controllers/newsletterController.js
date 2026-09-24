import db from '../database/db.js';

export async function subscribe(req, res) {
  const { email } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const existing = await db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.json({ message: "You're already on the list." });
  }

  await db.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)').run(email.toLowerCase());
  res.status(201).json({ message: 'Subscribed.' });
}
