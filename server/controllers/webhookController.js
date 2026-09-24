import db from '../database/db.js';
import { stripe } from '../services/stripeClient.js';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function alreadyProcessed(eventId) {
  const row = db.prepare('SELECT id FROM processed_webhook_events WHERE id = ?').get(eventId);
  return Boolean(row);
}

function markProcessed(eventId) {
  db.prepare('INSERT OR IGNORE INTO processed_webhook_events (id) VALUES (?)').run(eventId);
}

function confirmOrderPaid(session) {
  const orderId = Number(session.metadata?.order_id);
  if (!orderId) return;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return;

  db.prepare(
    "UPDATE orders SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END, updated_at = datetime('now') WHERE id = ?"
  ).run(orderId);

  db.prepare(
    `INSERT INTO payments (order_id, provider, provider_payment_id, stripe_session_id, amount, currency, status, method)
     VALUES (?, 'stripe', ?, ?, ?, ?, 'succeeded', ?)`
  ).run(
    orderId,
    session.payment_intent || session.id,
    session.id,
    (session.amount_total || 0) / 100,
    (session.currency || 'myr').toUpperCase(),
    session.payment_method_types?.[0] || 'card'
  );

  db.prepare(
    `INSERT INTO notifications (recipient_type, type, title, body, link)
     VALUES ('admin', 'payment', 'Payment received', ?, '/admin/orders')`
  ).run(`Order ${order.order_number} was paid (RM ${((session.amount_total || 0) / 100).toFixed(2)}).`);

  if (order.user_id) {
    db.prepare(
      `INSERT INTO notifications (recipient_type, recipient_id, type, title, body, link)
       VALUES ('customer', ?, 'payment', 'Payment confirmed', ?, '/orders/${orderId}')`
    ).run(order.user_id, `Your payment for order ${order.order_number} was confirmed.`);
  }
}

function markOrderPaymentFailed(session) {
  const orderId = Number(session.metadata?.order_id);
  if (!orderId) return;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return;

  db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(orderId);

  db.prepare(
    `INSERT INTO payments (order_id, provider, stripe_session_id, amount, currency, status)
     VALUES (?, 'stripe', ?, ?, ?, 'failed')`
  ).run(orderId, session.id, (session.amount_total || 0) / 100, (session.currency || 'myr').toUpperCase());
}

export async function stripeWebhook(req, res) {
  if (!stripe || !webhookSecret) {
    // Never fake-process a webhook we can't verify.
    return res.status(503).json({ error: 'Webhook receiver not configured.' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  if (alreadyProcessed(event.id)) {
    return res.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        confirmOrderPaid(session);
      }
      // If payment_status is 'unpaid' here, the method is async (e.g. FPX) —
      // wait for checkout.session.async_payment_succeeded instead.
      break;
    }
    case 'checkout.session.async_payment_succeeded': {
      confirmOrderPaid(event.data.object);
      break;
    }
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired': {
      markOrderPaymentFailed(event.data.object);
      break;
    }
    default:
      break; // ignore other event types
  }

  markProcessed(event.id);
  res.json({ received: true });
}
