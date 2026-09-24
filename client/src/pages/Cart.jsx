import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

function CustomizationSummary({ c }) {
  if (!c) return null;
  const bits = [];
  if (c.orderType) bits.push(c.orderType === 'exact' ? 'Exact design' : 'Customized');
  if (c.size) bits.push(`Size: ${c.size}`);
  if (c.flavour) bits.push(`Flavour: ${c.flavour}`);
  if (c.filling) bits.push(`Filling: ${c.filling}`);
  if (c.colour?.hex) bits.push(`Colour: ${c.colour.label || c.colour.hex}`);
  if (c.message?.text) bits.push(`Message: "${c.message.text}"`);
  if (c.occasion) bits.push(`Occasion: ${c.occasion}`);
  if (c.decorations?.length) bits.push(`Decorations: ${c.decorations.join(', ')}`);
  if (c.deliveryDate) bits.push(`Delivery: ${c.deliveryDate}${c.deliveryTime ? ` (${c.deliveryTime})` : ''}`);
  if (c.otherRequirements) bits.push(`Notes: ${c.otherRequirements}`);

  return (
    <ul className="mt-2 space-y-0.5">
      {bits.map((b, i) => (
        <li key={i} className="text-xs text-espresso/50">{b}</li>
      ))}
    </ul>
  );
}

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-32 text-center">
        <p className="font-display text-4xl mb-5">Your cart is empty.</p>
        <p className="text-espresso/60 mb-8">Browse the collection to find something worth celebrating.</p>
        <Link
          to="/collection"
          className="inline-block bg-espresso text-champagne px-8 py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
        >
          View Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16">
      <h1 className="font-display text-5xl mb-12">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-14">
        <div className="lg:col-span-2 divide-y divide-espresso/10">
          {items.map((item) => (
            <div key={item.lineId} className="flex gap-5 py-6">
              <div className="w-24 h-28 bg-beige overflow-hidden shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/cake/${item.slug}`} className="font-display text-xl hover:text-gold">
                      {item.name}
                    </Link>
                    <p className="text-sm text-espresso/50 mt-1">RM {item.price.toFixed(0)}</p>
                    <CustomizationSummary c={item.customization} />
                  </div>
                  <button onClick={() => removeItem(item.lineId)} aria-label={`Remove ${item.name} from cart`} className="text-espresso/30 hover:text-espresso shrink-0">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                    className="w-7 h-7 border border-espresso/20 flex items-center justify-center hover:border-espresso"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-sm w-6 text-center" aria-live="polite">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="w-7 h-7 border border-espresso/20 flex items-center justify-center hover:border-espresso"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-cream p-8 h-fit">
          <h2 className="font-display text-2xl mb-6">Order Summary</h2>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-espresso/60">Subtotal</span>
            <span>RM {subtotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-espresso/40 mb-6">
            Delivery fees and time slots are calculated at checkout.
          </p>
          <Link
            to="/checkout"
            className="block text-center bg-espresso text-champagne py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
