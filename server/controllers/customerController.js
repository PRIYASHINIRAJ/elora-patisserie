import db from '../database/db.js';

export async function listCustomers(req, res) {
  const { search } = req.query;
  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  if (search) {
    query += ' AND (full_name LIKE ? OR email LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like);
  }
  query += ' ORDER BY created_at DESC';

  const users = await db.prepare(query).all(...params);
  const customers = await Promise.all(users.map(async (u) => {
    const orderStats = await db
      .prepare("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0) AS spent FROM orders WHERE user_id = ?")
      .get(u.id);
    const customRequestCount = (await db.prepare('SELECT COUNT(*) AS n FROM custom_requests WHERE user_id = ?').get(u.id)).n;
    const conversationCount = (await db.prepare('SELECT COUNT(*) AS n FROM conversations WHERE user_id = ?').get(u.id)).n;
    const { password_hash, ...safe } = u;
    return {
      ...safe,
      orderCount: orderStats.n,
      totalSpent: orderStats.spent,
      customRequestCount,
      conversationCount,
    };
  }));

  res.json({ customers });
}

export async function getCustomer(req, res) {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Customer not found.' });

  const orders = await db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  const customRequests = await db.prepare('SELECT * FROM custom_requests WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
  const conversations = await db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY last_message_at DESC').all(user.id);
  const addresses = await db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(user.id);

  const totalSpent = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const { password_hash, ...safe } = user;
  res.json({ customer: { ...safe, totalSpent }, orders, customRequests, conversations, addresses });
}

export async function updateCustomerStatus(req, res) {
  const { accountStatus } = req.body; // active | blocked
  if (!['active', 'blocked'].includes(accountStatus)) {
    return res.status(400).json({ error: 'Invalid account status.' });
  }
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Customer not found.' });

  await db.prepare("UPDATE users SET account_status = ?, updated_at = datetime('now') WHERE id = ?").run(accountStatus, user.id);
  res.json({ message: 'Status updated.' });
}
