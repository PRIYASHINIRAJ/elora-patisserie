import db from '../database/db.js';

export function listCustomers(req, res) {
  const { search } = req.query;
  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  if (search) {
    query += ' AND (full_name LIKE ? OR email LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like);
  }
  query += ' ORDER BY created_at DESC';

  const customers = db.prepare(query).all(...params).map((u) => {
    const orderStats = db
      .prepare("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0) AS spent FROM orders WHERE user_id = ?")
      .get(u.id);
    const customRequestCount = db.prepare('SELECT COUNT(*) AS n FROM custom_requests WHERE user_id = ?').get(u.id).n;
    const conversationCount = db.prepare('SELECT COUNT(*) AS n FROM conversations WHERE user_id = ?').get(u.id).n;
    const { password_hash, ...safe } = u;
    return {
      ...safe,
      orderCount: orderStats.n,
      totalSpent: orderStats.spent,
      customRequestCount,
      conversationCount,
    };
  });

  res.json({ customers });
}

export function getCustomer(req, res) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Customer not found.' });

  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  const customRequests = db.prepare('SELECT * FROM custom_requests WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  const conversations = db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY last_message_at DESC').all(user.id);
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(user.id);

  const totalSpent = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const { password_hash, ...safe } = user;
  res.json({ customer: { ...safe, totalSpent }, orders, customRequests, conversations, addresses });
}

export function updateCustomerStatus(req, res) {
  const { accountStatus } = req.body; // active | blocked
  if (!['active', 'blocked'].includes(accountStatus)) {
    return res.status(400).json({ error: 'Invalid account status.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Customer not found.' });

  db.prepare("UPDATE users SET account_status = ?, updated_at = datetime('now') WHERE id = ?").run(accountStatus, user.id);
  res.json({ message: 'Status updated.' });
}
