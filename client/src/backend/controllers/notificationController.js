import db from '../database/db.js';

export async function listMyNotifications(req, res) {
  const notifications = await db
    .prepare(
      "SELECT * FROM notifications WHERE recipient_type = 'customer' AND recipient_id = ? ORDER BY created_at DESC LIMIT 50"
    )
    .all(req.user.id);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  res.json({ notifications, unreadCount });
}

export async function markMyNotificationsRead(req, res) {
  await db.prepare("UPDATE notifications SET is_read = 1 WHERE recipient_type = 'customer' AND recipient_id = ?").run(req.user.id);
  res.json({ message: 'Marked as read.' });
}

export async function listAdminNotifications(req, res) {
  const notifications = await db
    .prepare("SELECT * FROM notifications WHERE recipient_type = 'admin' ORDER BY created_at DESC LIMIT 50")
    .all();
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  res.json({ notifications, unreadCount });
}

export async function markAdminNotificationsRead(req, res) {
  await db.prepare("UPDATE notifications SET is_read = 1 WHERE recipient_type = 'admin'").run();
  res.json({ message: 'Marked as read.' });
}
