import db from '../database/db.js';

export function subscribe(req, res) {
  const { email } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.json({ message: "You're already on the list." });
  }

  db.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)').run(email.toLowerCase());
  res.status(201).json({ message: 'Subscribed.' });
}
