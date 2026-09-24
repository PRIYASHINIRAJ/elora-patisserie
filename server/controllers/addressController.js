import db from '../database/db.js';

export function listMyAddresses(req, res) {
  const addresses = db
    .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC')
    .all(req.user.id);
  res.json({ addresses });
}

export function createAddress(req, res) {
  const { label, recipientName, phone, line1, line2, city, state, postcode, isDefault } = req.body;
  if (!line1 || !city || !postcode) {
    return res.status(400).json({ error: 'Address line 1, city, and postcode are required.' });
  }

  if (isDefault) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }

  const info = db
    .prepare(
      `INSERT INTO addresses (user_id, label, recipient_name, phone, line1, line2, city, state, postcode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, label || null, recipientName || null, phone || null, line1, line2 || null, city, state || null, postcode, isDefault ? 1 : 0);

  const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ address });
}

export function updateAddress(req, res) {
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!address) return res.status(404).json({ error: 'Address not found.' });

  const { label, recipientName, phone, line1, line2, city, state, postcode, isDefault } = req.body;
  if (isDefault) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }

  db.prepare(
    `UPDATE addresses SET
      label = COALESCE(?, label), recipient_name = COALESCE(?, recipient_name), phone = COALESCE(?, phone),
      line1 = COALESCE(?, line1), line2 = ?, city = COALESCE(?, city), state = ?, postcode = COALESCE(?, postcode),
      is_default = ?
     WHERE id = ?`
  ).run(
    label, recipientName, phone, line1, line2 ?? address.line2, city, state ?? address.state, postcode,
    isDefault ? 1 : address.is_default, address.id
  );

  const fresh = db.prepare('SELECT * FROM addresses WHERE id = ?').get(address.id);
  res.json({ address: fresh });
}

export function deleteAddress(req, res) {
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!address) return res.status(404).json({ error: 'Address not found.' });
  db.prepare('DELETE FROM addresses WHERE id = ?').run(address.id);
  res.json({ message: 'Address deleted.' });
}
