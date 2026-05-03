import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ShopItem } from '../types';

const CART_KEY = 'vpulse_shop_cart_v1';

export type CartLine = {
  shopItemId: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerUsername?: string;
  maxStock: number;
  quantity: number;
};

function loadStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (product: ShopItem, qty?: number) => void;
  setQty: (shopItemId: string, qty: number) => void;
  removeLine: (shopItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lines, setLines] = useState<CartLine[]>(() => loadStored());

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines]);

  const addItem = useCallback((product: ShopItem, qty = 1) => {
    const q = Math.max(1, Math.floor(qty));
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.shopItemId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const line = next[idx];
        const merged = Math.min(line.quantity + q, product.stock);
        next[idx] = { ...line, quantity: merged, maxStock: product.stock, price: product.price };
        return next;
      }
      const quantity = Math.min(q, product.stock);
      if (quantity < 1) return prev;
      return [
        ...prev,
        {
          shopItemId: product.id,
          title: product.title,
          price: product.price,
          imageUrl: product.image_url || 'https://picsum.photos/seed/shop/400/400',
          sellerUsername: product.seller_username,
          maxStock: product.stock,
          quantity,
        },
      ];
    });
  }, []);

  const setQty = useCallback((shopItemId: string, qty: number) => {
    const n = Math.max(0, Math.floor(qty));
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.shopItemId === shopItemId);
      if (idx < 0) return prev;
      const line = prev[idx];
      const capped = Math.min(n, line.maxStock);
      if (capped <= 0) return prev.filter((l) => l.shopItemId !== shopItemId);
      const next = [...prev];
      next[idx] = { ...line, quantity: capped };
      return next;
    });
  }, []);

  const removeLine = useCallback((shopItemId: string) => {
    setLines((prev) => prev.filter((l) => l.shopItemId !== shopItemId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const itemCount = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      subtotal,
      addItem,
      setQty,
      removeLine,
      clearCart,
    }),
    [lines, itemCount, subtotal, addItem, setQty, removeLine, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
