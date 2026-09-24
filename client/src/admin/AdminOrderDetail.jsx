import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import api from '../services/api';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'];

function CustomizationDetail({ c }) {
  if (!c) return null;
  const rows = [
    ['Size', c.size], ['Flavour', c.flavor], ['Filling', c.filling], ['Colour', c.frosting_color],
    ['Message', c.message_on_cake], ['Font', c.font], ['Placement', c.message_placement],
    ['Occasion', c.occasion], ['Decorations', c.decorations?.length ? c.decorations.join(', ') : null],
    ['Notes', c.extra_notes],
  ].filter(([, v]) => v);
  if (rows.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-espresso/60">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-espresso/40">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const load = () => orderService.adminGet(id).then((d) => { setOrder(d.order); setNotes(d.order.admin_notes || ''); });
  useEffect(load, [id]);

  const handleSetStatus = async (status) => {
    setBusy(true);
    try {
      await orderService.adminUpdateStatus(id, status);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNotes = async () => {
    await api.patch(`/admin/orders/${id}/notes`, { notes });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleContactCustomer = async () => {
    if (!contactMessage) return;
    await api.post(`/admin/orders/${id}/message`, { message: contactMessage });
    setContactMessage('');
    setContactSent(true);
    setTimeout(() => setContactSent(false), 2000);
  };

  if (!order) return <div className="px-8 py-10 text-espresso/50 text-sm">Loading…</div>;

  const currentIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="px-8 py-10 lg:px-12 max-w-3xl">
      <Link to="/admin/orders" className="text-sm text-espresso/50 hover:text-espresso">← Back to Orders</Link>
      <h1 className="font-display text-4xl text-espresso mt-3 mb-1">{order.order_number}</h1>
      <p className="text-sm text-espresso/50 mb-8">{new Date(order.created_at).toLocaleString()}</p>

      {/* Status stepper */}
      <div className="bg-white border border-espresso/10 p-6 mb-6">
        <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-4">Order Status</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {STATUS_FLOW.map((s, i) => (
            <button
              key={s}
              onClick={() => handleSetStatus(s)}
              disabled={busy}
              className={`px-4 py-2 text-[11px] tracking-wide-cap uppercase border transition-colors disabled:opacity-50 ${
                order.status === s
                  ? 'bg-espresso text-champagne border-espresso'
                  : i < currentIdx
                  ? 'border-espresso/20 text-espresso/30 line-through'
                  : 'border-espresso/20 text-espresso/60 hover:border-espresso'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <button
          onClick={() => handleSetStatus('cancelled')}
          disabled={busy}
          className={`text-[11px] tracking-wide-cap uppercase px-4 py-2 border ${
            order.status === 'cancelled' ? 'bg-red-700 text-white border-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'
          }`}
        >
          Cancelled
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-espresso/10 p-5">
          <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Customer</p>
          <p className="font-medium">{order.customer_name}</p>
          <p className="text-sm text-espresso/60">{order.customer_email}</p>
          <p className="text-sm text-espresso/60">{order.customer_phone}</p>
        </div>
        <div className="bg-white border border-espresso/10 p-5">
          <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Payment</p>
          <p className="font-medium capitalize">{order.payment_status}</p>
          {order.payments?.[0] && (
            <p className="text-sm text-espresso/60 mt-1">
              {order.payments[0].method} · RM {order.payments[0].amount.toFixed(2)} · {order.payments[0].status}
            </p>
          )}
        </div>
        <div className="bg-white border border-espresso/10 p-5 sm:col-span-2">
          <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Delivery</p>
          <p className="font-medium">{order.delivery_type === 'pickup' ? 'Studio Pickup' : 'Delivery'}</p>
          {order.address && (
            <p className="text-sm text-espresso/60">{order.address.line1}, {order.address.city} {order.address.postcode}</p>
          )}
          <p className="text-sm text-espresso/60 mt-1">{order.delivery_date} {order.delivery_time_slot && `at ${order.delivery_time_slot}`}</p>
          {order.notes && <p className="text-sm text-espresso/60 mt-2 italic">"{order.notes}"</p>}
        </div>
      </div>

      <div className="bg-white border border-espresso/10 p-6">
        <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-4">Items</p>
        <div className="divide-y divide-espresso/10">
          {order.items.map((item) => (
            <div key={item.id} className="py-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.cake_name} × {item.quantity}</span>
                <span>RM {(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
              <CustomizationDetail c={item.customization} />
            </div>
          ))}
        </div>
        <div className="space-y-1.5 text-sm pt-4 mt-2 border-t border-espresso/10">
          <div className="flex justify-between"><span className="text-espresso/60">Subtotal</span><span>RM {order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-espresso/60">Delivery Fee</span><span>RM {order.delivery_fee.toFixed(2)}</span></div>
          <div className="flex justify-between font-display text-lg pt-2 border-t border-espresso/10"><span>Total</span><span>RM {order.total.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Admin notes */}
      <div className="bg-white border border-espresso/10 p-6 mt-6">
        <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-3">Internal Notes</p>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes only visible to the studio team…"
          className="w-full border border-espresso/20 px-3 py-2 text-sm mb-3 focus:outline-none focus:border-gold"
        />
        <div className="flex items-center gap-3">
          <button onClick={handleSaveNotes} className="text-xs tracking-wide-cap uppercase border border-espresso/30 px-5 py-2 hover:border-espresso">
            Save Notes
          </button>
          {notesSaved && <span className="text-sm text-gold">Saved.</span>}
        </div>
      </div>

      {/* Contact customer */}
      <div className="bg-white border border-espresso/10 p-6 mt-6">
        <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-3">Contact Customer</p>
        <textarea
          rows={3}
          value={contactMessage}
          onChange={(e) => setContactMessage(e.target.value)}
          placeholder="Send a message about this order…"
          className="w-full border border-espresso/20 px-3 py-2 text-sm mb-3 focus:outline-none focus:border-gold"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleContactCustomer}
            disabled={!contactMessage}
            className="bg-espresso text-champagne px-5 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
          >
            Send Message
          </button>
          {contactSent && <span className="text-sm text-gold">Sent — visible in Messages.</span>}
        </div>
      </div>
    </div>
  );
}
