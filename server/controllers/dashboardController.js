import db from '../database/db.js';

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

export function getDashboardStats(req, res) {
  const totalOrders = db.prepare('SELECT COUNT(*) AS n FROM orders').get().n;

  const statusCounts = Object.fromEntries(
    STATUSES.map((s) => [s, db.prepare('SELECT COUNT(*) AS n FROM orders WHERE status = ?').get(s).n])
  );

  const revenue = db
    .prepare("SELECT COALESCE(SUM(total),0) AS sum FROM orders WHERE payment_status = 'paid'")
    .get().sum;

  const totalSales = db
    .prepare("SELECT COALESCE(SUM(total),0) AS sum FROM orders WHERE status != 'cancelled'")
    .get().sum;

  const newEnquiries = db
    .prepare("SELECT COUNT(*) AS n FROM custom_requests WHERE status = 'new'")
    .get().n;

  const upcomingDeliveries = db
    .prepare(
      "SELECT COUNT(*) AS n FROM orders WHERE delivery_date >= date('now') AND status NOT IN ('completed','cancelled')"
    )
    .get().n;

  const unreadMessages = db
    .prepare("SELECT COUNT(*) AS n FROM messages WHERE sender_type = 'customer' AND is_read = 0")
    .get().n;

  // Revenue trend — last 14 days of paid orders
  const revenueTrend = db
    .prepare(
      `SELECT date(created_at) AS day, COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE payment_status = 'paid' AND created_at >= datetime('now', '-14 days')
       GROUP BY date(created_at)
       ORDER BY day ASC`
    )
    .all();

  // Popular cakes — by quantity sold across all non-cancelled orders
  const popularCakes = db
    .prepare(
      `SELECT oi.cake_name, SUM(oi.quantity) AS units_sold, SUM(oi.quantity * oi.unit_price) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status != 'cancelled'
       GROUP BY oi.cake_name
       ORDER BY units_sold DESC
       LIMIT 6`
    )
    .all();

  const recentOrders = db
    .prepare(
      `SELECT o.id, o.order_number, o.status, o.total, o.delivery_date, o.created_at,
              COALESCE(o.customer_name, u.full_name, 'Guest') AS customer_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC
       LIMIT 8`
    )
    .all();

  const recentEnquiries = db
    .prepare(
      `SELECT id, full_name, occasion, status, created_at
       FROM custom_requests
       ORDER BY created_at DESC
       LIMIT 5`
    )
    .all();

  res.json({
    stats: {
      totalOrders,
      pendingOrders: statusCounts.pending,
      confirmedOrders: statusCounts.confirmed,
      preparingOrders: statusCounts.preparing,
      readyOrders: statusCounts.ready,
      outForDeliveryOrders: statusCounts.out_for_delivery,
      completedOrders: statusCounts.completed,
      cancelledOrders: statusCounts.cancelled,
      revenue,
      totalSales,
      newEnquiries,
      upcomingDeliveries,
      unreadMessages,
    },
    revenueTrend,
    popularCakes,
    recentOrders,
    recentEnquiries,
  });
}
