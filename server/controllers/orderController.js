import db from '../database/db.js';
import { stripe, isStripeConfigured, requireStripeConfigured } from '../services/stripeClient.js';

function getDeliveryFee() {
  const row = db.prepare("SELECT value FROM business_settings WHERE key = 'delivery_fee'").get();
  const parsed = Number(row?.value);
  return Number.isFinite(parsed) ? parsed : 25;
}
// First entry if CLIENT_URL is a comma-separated list (see server.js CORS).
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

function parseJsonSafe(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function generateOrderNumber() {
  return `ELR-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

function attachOrderDetails(order) {
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const itemsWithCustomization = items.map((item) => {
    const customization = item.customization_id
      ? db.prepare('SELECT * FROM customizations WHERE id = ?').get(item.customization_id)
      : null;
    return {
      ...item,
      customization: customization
        ? {
            ...customization,
            occasion_fields: parseJsonSafe(customization.occasion_fields, {}),
            decorations: parseJsonSafe(customization.decorations, []),
          }
        : null,
    };
  });

  const address = order.address_id ? db.prepare('SELECT * FROM addresses WHERE id = ?').get(order.address_id) : null;
  const payments = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC').all(order.id);

  return { ...order, items: itemsWithCustomization, address, payments };
}

// ---------------------------------------------------------------------------
// Customer: create an order from the cart at checkout (pending, unpaid)
// ---------------------------------------------------------------------------
function parseJsonArraySafe(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Server is the source of truth for pricing — never trust a client-supplied
// unit price. Base price comes from the cake row; a size surcharge (if any)
// comes from that cake's admin-configured `sizes` list, matched by label.
function resolveAuthoritativePrice(item) {
  if (!item.cakeId) {
    throw new Error('Every order item must reference a real cake.');
  }
  const cake = db.prepare('SELECT * FROM cakes WHERE id = ?').get(item.cakeId);
  if (!cake || cake.status !== 'published') {
    throw new Error(`"${item.cakeName || 'This item'}" is no longer available.`);
  }

  let sizeSurcharge = 0;
  const requestedSize = item.customization?.size;
  if (requestedSize) {
    const sizes = parseJsonArraySafe(cake.sizes);
    const match = sizes.find((s) => s.label === requestedSize);
    if (match) sizeSurcharge = Number(match.price) || 0;
    // Unmatched sizes (e.g. a freeform "Custom" size) carry no automatic
    // surcharge — those need an admin quote via the custom request flow.
  }

  return { cakeName: cake.name, unitPrice: cake.base_price + sizeSurcharge };
}

export function createOrder(req, res) {
  const {
    customerName, customerEmail, customerPhone,
    addressLine1, addressLine2, city, state, postcode,
    deliveryDate, deliveryTimeSlot, deliveryType,
    items, // [{ cakeId, cakeName, quantity, customization }] — price is resolved server-side
    notes,
  } = req.body;

  if (!customerName || !customerEmail || !customerPhone) {
    return res.status(400).json({ error: 'Name, email, and phone are required.' });
  }
  if (!items?.length) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }
  if (deliveryType !== 'pickup' && (!addressLine1 || !city || !postcode)) {
    return res.status(400).json({ error: 'A delivery address is required.' });
  }
  if (!deliveryDate) {
    return res.status(400).json({ error: 'A delivery date is required.' });
  }

  let pricedItems;
  try {
    pricedItems = items.map((item) => ({ ...item, ...resolveAuthoritativePrice(item) }));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const subtotal = pricedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const minOrderRow = db.prepare("SELECT value FROM business_settings WHERE key = 'minimum_order'").get();
  const minimumOrder = Number(minOrderRow?.value) || 0;
  if (subtotal < minimumOrder) {
    return res.status(400).json({ error: `Minimum order is RM ${minimumOrder.toFixed(2)}. Please add more to your cart.` });
  }

  const deliveryFee = deliveryType === 'pickup' ? 0 : getDeliveryFee();
  const total = subtotal + deliveryFee;

  let addressId = null;
  if (deliveryType !== 'pickup') {
    const addrInfo = db
      .prepare(
        `INSERT INTO addresses (user_id, recipient_name, phone, line1, line2, city, state, postcode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(req.user?.id || null, customerName, customerPhone, addressLine1, addressLine2 || null, city, state || null, postcode);
    addressId = addrInfo.lastInsertRowid;
  }

  const orderNumber = generateOrderNumber();
  const orderInfo = db
    .prepare(
      `INSERT INTO orders
       (order_number, user_id, status, payment_status, delivery_type, delivery_date, delivery_time_slot,
        address_id, subtotal, delivery_fee, total, notes, customer_name, customer_email, customer_phone)
       VALUES (?, ?, 'pending', 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      orderNumber, req.user?.id || null, deliveryType || 'delivery', deliveryDate, deliveryTimeSlot || null,
      addressId, subtotal, deliveryFee, total, notes || null, customerName, customerEmail, customerPhone
    );

  const orderId = orderInfo.lastInsertRowid;

  const insertCustomization = db.prepare(
    `INSERT INTO customizations
     (size, flavor, filling, frosting_color, topper_text, message_on_cake, extra_notes, extra_cost,
      font, message_placement, occasion, occasion_fields, decorations, order_type)
     VALUES (@size, @flavor, @filling, @frosting_color, @topper_text, @message_on_cake, @extra_notes, @extra_cost,
      @font, @message_placement, @occasion, @occasion_fields, @decorations, @order_type)`
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, cake_id, cake_name, quantity, unit_price, customization_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  pricedItems.forEach((item) => {
    let customizationId = null;
    const c = item.customization;
    if (c) {
      const info = insertCustomization.run({
        size: c.size || null,
        flavor: c.flavour || null,
        filling: c.filling || null,
        frosting_color: c.colour?.hex || null,
        topper_text: null,
        message_on_cake: c.message?.text || null,
        extra_notes: c.otherRequirements || null,
        extra_cost: item.unitPrice - (db.prepare('SELECT base_price FROM cakes WHERE id = ?').get(item.cakeId)?.base_price || item.unitPrice),
        font: c.message?.font || null,
        message_placement: c.message?.placement || null,
        occasion: c.occasion || null,
        occasion_fields: JSON.stringify(c.occasionFields || {}),
        decorations: JSON.stringify(c.decorations || []),
        order_type: c.orderType || null,
      });
      customizationId = info.lastInsertRowid;
    }
    insertItem.run(orderId, item.cakeId || null, item.cakeName, item.quantity, item.unitPrice, customizationId);
  });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  if (req.user?.id) {
    db.prepare(
      `INSERT INTO notifications (recipient_type, recipient_id, type, title, body, link)
       VALUES ('customer', ?, 'order_received', 'Order received', ?, '/orders/${orderId}')`
    ).run(req.user.id, `We've received your order ${orderNumber}. Complete payment to confirm it.`);
  }
  db.prepare(
    `INSERT INTO notifications (recipient_type, type, title, body, link)
     VALUES ('admin', 'new_order', 'New order', ?, '/admin/orders/${orderId}')`
  ).run(`${customerName} placed an order (${orderNumber}) for RM ${total.toFixed(2)}.`);

  res.status(201).json({ order: attachOrderDetails(order) });
}

// ---------------------------------------------------------------------------
// Stripe Checkout Session — used for both initial payment and retry
// ---------------------------------------------------------------------------
export async function createCheckoutSession(req, res) {
  if (!requireStripeConfigured(res)) return;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (req.user && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to pay for this order.' });
  }
  if (order.payment_status === 'paid') {
    return res.status(400).json({ error: 'This order has already been paid.' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const lineItems = items.map((item) => ({
    price_data: {
      currency: 'myr',
      product_data: { name: item.cake_name },
      unit_amount: Math.round(item.unit_price * 100),
    },
    quantity: item.quantity,
  }));

  if (order.delivery_fee > 0) {
    lineItems.push({
      price_data: {
        currency: 'myr',
        product_data: { name: 'Delivery Fee' },
        unit_amount: Math.round(order.delivery_fee * 100),
      },
      quantity: 1,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'fpx'],
      line_items: lineItems,
      customer_email: order.customer_email,
      success_url: `${CLIENT_URL}/orders/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/checkout?order=${order.id}&payment=cancelled`,
      metadata: { order_id: String(order.id), order_number: order.order_number },
    });

    db.prepare(
      "UPDATE orders SET stripe_checkout_session_id = ?, payment_status = 'processing', updated_at = datetime('now') WHERE id = ?"
    ).run(session.id, order.id);

    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] failed to create checkout session', err);
    res.status(502).json({ error: 'Could not start payment with Stripe. Please try again.' });
  }
}

// ---------------------------------------------------------------------------
// Customer: retrieve own order (confirmation + status)
// ---------------------------------------------------------------------------
export function getMyOrder(req, res) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to view this order.' });
  }
  res.json({ order: attachOrderDetails(order), stripeConfigured: isStripeConfigured() });
}

export function listMyOrders(req, res) {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ orders: orders.map(attachOrderDetails) });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export function adminListOrders(req, res) {
  const { status, search } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  query += ' ORDER BY created_at DESC';
  const orders = db.prepare(query).all(...params);
  res.json({ orders: orders.map(attachOrderDetails) });
}

export function adminGetOrder(req, res) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order: attachOrderDetails(order) });
}

export function adminUpdateNotes(req, res) {
  const { notes } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  db.prepare("UPDATE orders SET admin_notes = ?, updated_at = datetime('now') WHERE id = ?").run(notes || null, order.id);
  res.json({ message: 'Notes saved.' });
}

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

const STATUS_NOTIFICATION_TITLE = {
  confirmed: 'Order confirmed',
  preparing: 'Your cake is being prepared',
  ready: 'Your order is ready',
  out_for_delivery: 'Your order is out for delivery',
  completed: 'Order completed',
  cancelled: 'Order cancelled',
};

export function adminUpdateStatus(req, res) {
  const { status } = req.body;
  if (!STATUS_FLOW.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, order.id);

  if (order.user_id) {
    db.prepare(
      `INSERT INTO notifications (recipient_type, recipient_id, type, title, body, link)
       VALUES ('customer', ?, 'order_status', ?, ?, '/orders/${order.id}')`
    ).run(
      order.user_id,
      STATUS_NOTIFICATION_TITLE[status] || 'Order status updated',
      `Order ${order.order_number} is now ${status.replace(/_/g, ' ')}.`
    );
  }

  if (status === 'cancelled') {
    db.prepare(
      `INSERT INTO notifications (recipient_type, type, title, body, link)
       VALUES ('admin', 'order_cancelled', 'Order cancelled', ?, '/admin/orders/${order.id}')`
    ).run(`Order ${order.order_number} was cancelled.`);
  }

  res.json({ message: 'Status updated.' });
}
