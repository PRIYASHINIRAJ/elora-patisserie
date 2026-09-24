import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';
import { orderService } from '../services/orderService';

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PAYMENT_LABEL = {
  unpaid: { label: 'Unpaid', color: 'text-espresso/50' },
  processing: { label: 'Processing', color: 'text-mocha' },
  paid: { label: 'Paid', color: 'text-green-700' },
  failed: { label: 'Payment Failed', color: 'text-red-700' },
  refunded: { label: 'Refunded', color: 'text-espresso/50' },
};

function CustomizationDetail({ c }) {
  if (!c) return null;
  const rows = [
    ['Size', c.size],
    ['Flavour', c.flavor],
    ['Filling', c.filling],
    ['Colour', c.frosting_color],
    ['Message', c.message_on_cake],
    ['Font', c.font],
    ['Placement', c.message_placement],
    ['Occasion', c.occasion],
    ['Decorations', c.decorations?.length ? c.decorations.join(', ') : null],
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

export default function OrderDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    orderService.get(id).then((d) => setOrder(d.order)).catch(() => setNotFound(true));
  }, [id]);

  useEffect(load, [load]);

  // If we just came back from Stripe, the webhook may land a beat after redirect —
  // poll briefly so the confirmation reflects the real payment status.
  useEffect(() => {
    if (!searchParams.get('session_id')) return;
    if (order?.payment_status === 'paid' || order?.payment_status === 'failed') return;
    const interval = setInterval(load, 2500);
    const timeout = setTimeout(() => clearInterval(interval), 20000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [searchParams, order, load]);

  const handleRetry = async () => {
    setRetrying(true);
    setError('');
    try {
      const { url } = await orderService.createCheckoutSession(id);
      window.location.href = url;
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start payment. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <p className="font-display text-3xl mb-4">Order not found.</p>
        <Link to="/orders" className="text-gold text-sm tracking-wide-cap uppercase underline">Back to Orders</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-espresso/50 text-sm">Loading…</div>;
  }

  const payment = PAYMENT_LABEL[order.payment_status] || PAYMENT_LABEL.unpaid;

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
      <div className="text-center mb-12">
        {order.payment_status === 'paid' ? (
          <CheckCircle2 size={44} className="mx-auto text-green-600 mb-4" />
        ) : order.payment_status === 'failed' ? (
          <XCircle size={44} className="mx-auto text-red-600 mb-4" />
        ) : (
          <Clock size={44} className="mx-auto text-mocha mb-4" />
        )}
        <p className="text-xs tracking-wide-cap uppercase text-gold mb-3">
          {order.payment_status === 'paid' ? 'Order Confirmed' : order.payment_status === 'failed' ? 'Payment Failed' : 'Awaiting Payment'}
        </p>
        <h1 className="font-display text-4xl mb-2">{order.order_number}</h1>
        <p className={`text-sm ${payment.color}`}>{payment.label} · {STATUS_LABEL[order.status] || order.status}</p>
      </div>

      {order.payment_status === 'failed' && (
        <div className="border border-red-200 bg-red-50 p-6 mb-8 text-center">
          <p className="text-sm text-red-800 mb-4">Your payment didn't go through. No charge was made — you can try again.</p>
          {error && <p className="text-xs text-red-700 mb-3">{error}</p>}
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 bg-espresso text-champagne px-6 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
          >
            <RotateCcw size={14} /> {retrying ? 'Redirecting…' : 'Retry Payment'}
          </button>
        </div>
      )}

      {(order.payment_status === 'unpaid' || order.payment_status === 'processing') && (
        <div className="border border-gold/30 bg-champagne/30 p-6 mb-8 text-center">
          <p className="text-sm text-espresso/70 mb-4">
            {order.payment_status === 'processing'
              ? 'Waiting for payment confirmation from the bank — this can take a moment for FPX transfers.'
              : "This order hasn't been paid yet."}
          </p>
          {order.payment_status === 'unpaid' && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-2 bg-espresso text-champagne px-6 py-2.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
            >
              {retrying ? 'Redirecting…' : 'Pay Now'}
            </button>
          )}
        </div>
      )}

      <div className="bg-cream p-8 mb-8">
        <h2 className="font-display text-2xl mb-5">Order Details</h2>
        <div className="divide-y divide-espresso/10">
          {order.items.map((item) => (
            <div key={item.id} className="py-4">
              <div className="flex justify-between text-sm">
                <span>{item.cake_name} × {item.quantity}</span>
                <span>RM {(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
              <CustomizationDetail c={item.customization} />
            </div>
          ))}
        </div>
        <div className="space-y-1.5 text-sm pt-4 mt-2 border-t border-espresso/10">
          <div className="flex justify-between"><span className="text-espresso/60">Subtotal</span><span>RM {order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-espresso/60">Delivery Fee</span><span>RM {order.delivery_fee.toFixed(2)}</span></div>
          <div className="flex justify-between font-display text-xl pt-2 border-t border-espresso/10"><span>Total</span><span>RM {order.total.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 text-sm">
        <div>
          <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Delivery</p>
          <p>{order.delivery_type === 'pickup' ? 'Studio Pickup' : order.address ? `${order.address.line1}, ${order.address.city} ${order.address.postcode}` : '—'}</p>
          <p className="text-espresso/60 mt-1">{order.delivery_date} {order.delivery_time_slot && `at ${order.delivery_time_slot}`}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-wide-cap uppercase text-espresso/40 mb-2">Contact</p>
          <p>{order.customer_name}</p>
          <p className="text-espresso/60">{order.customer_email} · {order.customer_phone}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/orders" className="flex-1 text-center bg-espresso text-champagne py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors">
          View Order
        </Link>
        <Link to="/contact" className="flex-1 text-center border border-espresso/30 py-3.5 text-xs tracking-wide-cap uppercase hover:border-espresso transition-colors">
          Contact Élora
        </Link>
      </div>
    </div>
  );
}
