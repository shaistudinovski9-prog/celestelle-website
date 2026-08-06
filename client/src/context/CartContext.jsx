// Cart state with localStorage persistence. Storefront shopping needs no login.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { cartAdd, cartSetQty, cartRemove, cartCount } from '../lib/cart';

const CartContext = createContext(null);
const STORAGE_KEY = 'cel_cart';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitial);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const add = useCallback((entry, qty = 1) => setItems((cur) => cartAdd(cur, entry, qty)), []);
  const setQty = useCallback((key, qty) => setItems((cur) => cartSetQty(cur, key, qty)), []);
  const remove = useCallback((key) => setItems((cur) => cartRemove(cur, key)), []);
  const clear = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count: cartCount(items) }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
