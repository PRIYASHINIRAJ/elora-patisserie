import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

function CustomizationSummary({ c }) {
  if (!c) return null;
  const bits = [];
  if (c.size) bits.push(c.size);
  if (c.flavour) bits.push(c.flavour);
  if (c.colour?.label) bits.push(c.colour.label);
  if (c.message?.text) bits.push(`"${c.message.text}"`);

  if (bits.length === 0) return null;
  return <p className="text-xs text-espresso/50 mt-1 truncate">{bits.join(' · ')}</p>;
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, count } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-espresso/40 z-[60]"
            onClick={closeCart}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[440px] bg-ivory z-[70] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-espresso/10">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <ShoppingBag size={20} strokeWidth={1.4} /> Your Cart {count > 0 && `(${count})`}
              </h2>
              <button onClick={closeCart} aria-label="Close cart" className="text-espresso/50 hover:text-espresso">
                <X size={22} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <p className="font-display text-2xl mb-3">Your cart is empty.</p>
                <p className="text-espresso/50 text-sm mb-6">Browse the collection to find something worth celebrating.</p>
                <Link
                  to="/collection"
                  onClick={closeCart}
                  className="bg-espresso text-champagne px-7 py-3 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors"
                >
                  View Collection
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-espresso/10 px-6">
                  {items.map((item) => (
                    <div key={item.lineId} className="flex gap-4 py-5">
                      <div className="w-16 h-20 bg-beige overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <Link to={`/cake/${item.slug}`} onClick={closeCart} className="font-display text-lg hover:text-gold truncate block">
                              {item.name}
                            </Link>
                            <p className="text-xs text-espresso/50">RM {item.price.toFixed(0)}</p>
                            <CustomizationSummary c={item.customization} />
                          </div>
                          <button onClick={() => removeItem(item.lineId)} aria-label={`Remove ${item.name} from cart`} className="text-espresso/30 hover:text-espresso shrink-0">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-6 h-6 border border-espresso/20 flex items-center justify-center hover:border-espresso"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-xs w-5 text-center" aria-live="polite">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="w-6 h-6 border border-espresso/20 flex items-center justify-center hover:border-espresso"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-espresso/10 px-6 py-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-espresso/60">Subtotal</span>
                    <span>RM {subtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-espresso/40 mb-5">Delivery fee calculated at checkout.</p>
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="block text-center bg-espresso text-champagne py-3.5 text-xs tracking-wide-cap uppercase hover:bg-mocha transition-colors mb-2"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    to="/cart"
                    onClick={closeCart}
                    className="block text-center text-xs tracking-wide-cap uppercase text-espresso/50 hover:text-espresso py-2"
                  >
                    View Full Cart
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
