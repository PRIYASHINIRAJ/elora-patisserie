import db from '../database/db.js';

export function listMyNotifications(req, res) {
  const notifications = db
    .prepare(
      "SELECT * FROM notifications WHERE recipient_type = 'customer' AND recipient_id = ? ORDER BY created_at DESC LIMIT 50"
    )
    .all(req.user.id);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  res.json({ notifications, unreadCount });
}

export function markMyNotificationsRead(req, res) {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE recipient_type = 'customer' AND recipient_id = ?").run(req.user.id);
  res.json({ message: 'Marked as read.' });
}

export function listAdminNotifications(req, res) {
  const notifications = db
    .prepare("SELECT * FROM notifications WHERE recipient_type = 'admin' ORDER BY created_at DESC LIMIT 50")
    .all();
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  res.json({ notifications, unreadCount });
}

export function markAdminNotificationsRead(req, res) {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE recipient_type = 'admin'").run();
  res.json({ message: 'Marked as read.' });
}
