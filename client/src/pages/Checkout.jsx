import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';

const DELIVERY_FEE_PREVIEW = 25;

function CustomizationLine({ c }) {
  if (!c) return null;
  const bits = [];
  if (c.size) bits.push(`Size: ${c.size}`);
  if (c.flavour) bits.push(`Flavour: ${c.flavour}`);
  if (c.filling) bits.push(`Filling: ${c.filling}`);
  if (c.colour?.label) bits.push(`Colour: ${c.colour.label}`);
  if (c.message?.text) bits.push(`Message: "${c.message.text}"`);
  if (c.occasion) bits.push(`Occasion: ${c.occasion}`);
  if (c.decorations?.length) bits.push(`Decorations: ${c.decorations.join(', ')}`);
  if (bits.length === 0) return null;
  return <p className="text-xs text-espresso/50 mt-1">{bits.join(' · ')}</p>;
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState('delivery');
  const [form, setForm] = useState({
    customerName: user?.full_name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: 'Kuala Lumpur',
    state: '',
    postcode: '',
    deliveryDate: '',
    deliveryTimeSlot: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const deliveryFee = deliveryType === 'pickup' ? 0 : DELIVERY_FEE_PREVIEW;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <p className="font-display text-4xl mb-5">There's nothing to check out yet.</p>
        <Link to="/collection" className="text-gold text-sm tracking-wide-cap uppercase underline">
          Browse the Collection
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <p className="font-display text-4xl mb-5">Please log in to check out.</p>
        <p className="text-espresso/60 mb-8">We keep your order history and delivery details tied to your account.</p>
        <Link
          to="/login"
          state={{ from: { pathname: '/checkout' } }}
          className="inline-block bg-espresso text-champagne px-8 py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
        >
          Log In
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        deliveryType,
        addressLine1: deliveryType === 'pickup' ? undefined : form.addressLine1,
        addressLine2: deliveryType === 'pickup' ? undefined : form.addressLine2,
        city: deliveryType === 'pickup' ? undefined : form.city,
        state: deliveryType === 'pickup' ? undefined : form.state,
        postcode: deliveryType === 'pickup' ? undefined : form.postcode,
        deliveryDate: form.deliveryDate,
        deliveryTimeSlot: form.deliveryTimeSlot,
        notes: form.notes,
        items: items.map((i) => ({
          cakeId: i.cakeId,
          cakeName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          customization: i.customization,
        })),
      };

      const { order } = await orderService.create(payload);

      // Real payment: attempt to start a Stripe Checkout Session.
      try {
        const { url } = await orderService.createCheckoutSession(order.id);
        clearCart();
        window.location.href = url; // redirect to Stripe's hosted checkout
      } catch {
        // Order exists (pending/unpaid) even if payment couldn't start — send them
        // to the order page, which shows a clear "payment not available" state
        // and a Retry Payment button, rather than a fake success screen.
        clearCart();
        navigate(`/orders/${order.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong creating your order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-16">
      <h1 className="font-display text-5xl mb-12">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-14">
        <div className="lg:col-span-2 space-y-10">
          {/* Customer */}
          <section>
            <h2 className="font-display text-2xl mb-5">Customer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Name</label>
                <input required value={form.customerName} onChange={set('customerName')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Email</label>
                <input required type="email" value={form.customerEmail} onChange={set('customerEmail')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Phone</label>
                <input required value={form.customerPhone} onChange={set('customerPhone')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section>
            <h2 className="font-display text-2xl mb-5">Delivery</h2>
            <div className="flex gap-3 mb-5">
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                className={`px-5 py-2 text-xs tracking-wide-cap uppercase border ${deliveryType === 'delivery' ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/60'}`}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('pickup')}
                className={`px-5 py-2 text-xs tracking-wide-cap uppercase border ${deliveryType === 'pickup' ? 'bg-espresso text-champagne border-espresso' : 'border-espresso/20 text-espresso/60'}`}
              >
                Studio Pickup
              </button>
            </div>

            {deliveryType === 'delivery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Address Line 1</label>
                  <input required value={form.addressLine1} onChange={set('addressLine1')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Address Line 2 (optional)</label>
                  <input value={form.addressLine2} onChange={set('addressLine2')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">City</label>
                  <input required value={form.city} onChange={set('city')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Postcode</label>
                  <input required value={form.postcode} onChange={set('postcode')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">State</label>
                  <input value={form.state} onChange={set('state')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Delivery Date</label>
                <input required type="date" value={form.deliveryDate} onChange={set('deliveryDate')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Delivery Time</label>
                <input type="time" value={form.deliveryTimeSlot} onChange={set('deliveryTimeSlot')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[11px] tracking-wide-cap uppercase text-espresso/50 mb-2">Order Notes (optional)</label>
              <textarea rows={2} value={form.notes} onChange={set('notes')} className="w-full border border-espresso/20 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
          </section>
        </div>

        {/* Order review + payment */}
        <div className="bg-cream p-8 h-fit sticky top-24">
          <h2 className="font-display text-2xl mb-6">Order Review</h2>
          <div className="divide-y divide-espresso/10 mb-5 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.lineId} className="py-3 text-sm">
                <div className="flex justify-between">
                  <span>{item.name} × {item.quantity}</span>
                  <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <CustomizationLine c={item.customization} />
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm border-t border-espresso/10 pt-4">
            <div className="flex justify-between">
              <span className="text-espresso/60">Subtotal</span>
              <span>RM {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-espresso/60">Delivery Fee</span>
              <span>{deliveryFee > 0 ? `RM ${deliveryFee.toFixed(2)}` : 'Free (pickup)'}</span>
            </div>
            <div className="flex justify-between font-display text-xl pt-2 border-t border-espresso/10">
              <span>Total</span>
              <span>RM {total.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-700 mt-4">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 bg-espresso text-champagne py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors disabled:opacity-50"
          >
            {submitting ? 'Processing…' : 'Proceed to Payment'}
          </button>
          <p className="text-[11px] text-espresso/40 mt-3 text-center">
            You'll be redirected to Stripe's secure checkout. We never see or store your card details.
          </p>
        </div>
      </form>
    </div>
  );
}
