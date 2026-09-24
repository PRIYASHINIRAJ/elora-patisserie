import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'elora_cart_v2';

function computeLinePrice(cake, customization) {
  let price = cake.base_price ?? cake.price ?? 0;
  const sizeExtra = customization?.sizeExtraCost || 0;
  return price + sizeExtra;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Simple add (Day 1/2 behaviour) — merges by cakeId, no customization.
  const addItem = (cake, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.cakeId === cake.id && !i.customization);
      if (existing) {
        return prev.map((i) =>
          i.lineId === existing.lineId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          lineId: `${cake.id}-${Date.now()}`,
          cakeId: cake.id,
          name: cake.name,
          slug: cake.slug,
          price: cake.base_price,
          image: cake.image_url,
          quantity,
          customization: null,
        },
      ];
    });
    setIsOpen(true);
  };

  // Customized add — always a distinct line, carries the full customization payload.
  const addCustomizedItem = (cake, quantity, customization) => {
    const lineId = `${cake.id}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    setItems((prev) => [
      ...prev,
      {
        lineId,
        cakeId: cake.id,
        name: cake.name,
        slug: cake.slug,
        price: computeLinePrice(cake, customization),
        image: cake.image_url,
        quantity,
        customization,
      },
    ]);
    setIsOpen(true);
    return lineId;
  };

  const removeItem = (lineId) => setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const updateQuantity = (lineId, quantity) => {
    if (quantity < 1) return removeItem(lineId);
    setItems((prev) => prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, addCustomizedItem, removeItem, updateQuantity, clearCart, subtotal, count, isOpen, openCart, closeCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
