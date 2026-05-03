import React, { useCallback, useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  ChevronRight,
  Tag,
  Star,
  ShoppingCart,
  Package,
  Zap,
  TrendingUp,
  Filter,
  Plus,
  Minus,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { fetchMarketplace, checkoutCart, fetchMyPurchases, type ShippingCheckoutPayload } from '../services/shopApi';
import type { ShopItem, ShopPurchaseRow } from '../types';
import { AddProductModal } from '../components/shop/AddProductModal';
import { CheckoutDetailsModal } from '../components/shop/CheckoutDetailsModal';
import { cn } from '@/lib/utils';

const categories = ['All', 'Apparel', 'Gear', 'Digital', 'Collectibles', 'PULSE Pack'] as const;

const Shop = () => {
  const { user, refreshProfile } = useAuth();
  const { lines, itemCount, subtotal, addItem, setQty, removeLine, clearCart } = useCart();

  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('All');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);
  const [purchases, setPurchases] = useState<ShopPurchaseRow[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchMarketplace({
        category: activeCategory,
        q: debouncedSearch || undefined,
      });
      setProducts(list);
    } catch {
      toast.error('Could not load marketplace', { description: 'Is the API running?' });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const loadPurchases = useCallback(async () => {
    if (!user) return;
    setPurchasesLoading(true);
    try {
      const rows = await fetchMyPurchases();
      setPurchases(rows);
    } catch {
      toast.error('Could not load purchases', { description: 'Try again.' });
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (purchasesOpen && user) {
      loadPurchases();
    }
  }, [purchasesOpen, user, loadPurchases]);

  const handleCreated = (item: ShopItem) => {
    setProducts((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
  };

  const openCheckoutDetails = () => {
    if (!user) {
      toast.error('Sign in to checkout', { description: 'You need an account to purchase.' });
      return;
    }
    if (lines.length === 0) return;
    setCheckoutOpen(true);
  };

  const completeCheckout = async (shipping: ShippingCheckoutPayload) => {
    if (!user || lines.length === 0) return;
    setCheckoutLoading(true);
    try {
      const res = await checkoutCart(
        lines.map((l) => ({ shopItemId: l.shopItemId, quantity: l.quantity })),
        shipping,
      );
      clearCart();
      setCartOpen(false);
      setCheckoutOpen(false);
      await refreshProfile();
      loadProducts();
      await loadPurchases();
      toast.success('Order complete', {
        description: `Total $${Number(res.total).toFixed(2)} — balance updated.`,
      });
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string; required?: string; balance?: string } } };
      const d = ax.response?.data;
      if (d?.detail?.toLowerCase().includes('insufficient')) {
        toast.error('Insufficient balance', {
          description: `Need $${d?.required ?? '—'} (you have $${d?.balance ?? '—'}).`,
        });
        return;
      }
      if (typeof d?.detail === 'string') {
        toast.error('Checkout failed', { description: d.detail });
        return;
      }
      toast.error('Checkout failed', { description: 'Sign in and try again.' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-vpulse/10">
              <ShoppingBag className="h-6 w-6 text-purple-vpulse" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Marketplace</h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight">
            Equip your channel. Support your favorite creators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-purple-vpulse/40 bg-purple-vpulse/10 px-5 py-3 text-sm font-bold text-purple-vpulse transition-all hover:bg-purple-vpulse/20"
            >
              <Plus className="h-4 w-4" />
              Add product
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setPurchasesOpen(false);
              setCartOpen(true);
            }}
            className="relative rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-6 w-6 text-white" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-vpulse px-1 text-[10px] font-black text-black">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!user) {
                toast.message('Sign in to see purchases', { description: 'Log in to view your order history.' });
                return;
              }
              setCartOpen(false);
              setPurchasesOpen(true);
            }}
            className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-black shadow-xl transition-all hover:bg-zinc-200 active:scale-95"
          >
            My Purchases
          </button>
        </div>
      </div>

      <AddProductModal isOpen={addOpen} onClose={() => setAddOpen(false)} onCreated={handleCreated} />

      <CheckoutDetailsModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        user={user}
        subtotal={subtotal}
        loading={checkoutLoading}
        onConfirm={completeCheckout}
      />

      {/* Featured Banner */}
      <div className="relative h-[220px] w-full overflow-hidden rounded-[32px] border border-white/5 shadow-2xl lg:h-[250px]">
        <img
          src="https://picsum.photos/seed/merch/1200/400"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/40 to-transparent" />
        <div className="absolute inset-x-8 bottom-8 max-w-lg space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-purple-vpulse" />
            <span className="text-xs font-black uppercase tracking-widest text-white/60">
              Creator storefront
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white lg:text-4xl">THE PULSE DROP</h2>
          <Link
            to="/profile/stores"
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-vpulse hover:underline"
          >
            Your channel store <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Filtering */}
      <div className="flex flex-col gap-6 border-b border-white/5 pb-8 md:flex-row md:items-center">
        <div className="no-scrollbar flex-1 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all',
                  activeCategory === cat
                    ? 'bg-purple-vpulse text-white shadow-xl shadow-purple-500/20'
                    : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-purple-vpulse" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search gear..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm font-medium text-white outline-none transition-all focus:border-purple-vpulse/50 md:w-64"
            />
          </div>
          <button
            type="button"
            className="rounded-xl border border-white/10 p-3 transition-all hover:bg-white/5"
            aria-hidden
          >
            <Filter className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
      </div>

      {user && (
        <p className="text-xs text-zinc-500">
          Pulse balance:{' '}
          <span className="font-mono font-bold text-white">
            $
            {typeof user.balance === 'number'
              ? user.balance.toFixed(2)
              : parseFloat(String(user.balance || 0)).toFixed(2)}
          </span>
        </p>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-vpulse border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 py-20 text-center">
          <p className="text-zinc-400">No products match your filters.</p>
          {user && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-4 text-sm font-bold text-purple-vpulse hover:underline"
            >
              List the first product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              whileHover={{ y: -6 }}
              className="group flex flex-col gap-4 rounded-3xl border border-white/5 bg-obsidian p-4 shadow-xl transition-all hover:border-purple-vpulse/20"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-900">
                <img
                  src={product.image_url || 'https://picsum.photos/seed/shop/600/600'}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  <div className="rounded-full border border-cyan-vpulse/20 bg-void/60 px-3 py-1 text-[10px] font-black uppercase text-cyan-vpulse backdrop-blur-md">
                    {product.category}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (product.stock < 1) {
                      toast.message('Out of stock');
                      return;
                    }
                    if (user?.id === product.seller) {
                      toast.message('Your listing', { description: 'You cannot add your own product to cart.' });
                      return;
                    }
                    addItem(product, 1);
                    toast.success('Added to cart', { description: product.title });
                  }}
                  disabled={product.stock < 1}
                  className="absolute bottom-3 right-3 rounded-full bg-white p-3 text-black opacity-0 shadow-2xl transition-all hover:scale-110 group-hover:opacity-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {product.seller_username ? `@${product.seller_username}` : 'Creator'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-black text-yellow-500">
                    <Star className="h-3 w-3 fill-yellow-500" /> 4.9
                  </div>
                </div>
                <h3 className="line-clamp-2 text-lg font-bold leading-tight text-white transition-colors group-hover:text-purple-vpulse">
                  {product.title}
                </h3>
                <p className="line-clamp-2 text-[11px] text-zinc-500">{product.description}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xl font-black tracking-tighter text-white">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500">
                    {product.stock} in stock
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-purple-vpulse">
                  <TrendingUp className="h-3 w-3" /> Pulse rewards
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm"
              aria-label="Close cart overlay"
              onClick={() => setCartOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-[140] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-vpulse" />
                  <span className="text-lg font-black uppercase tracking-tight text-white">Cart</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-zinc-400">
                    {itemCount} items
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="rounded-full p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {lines.length === 0 ? (
                  <p className="py-12 text-center text-sm text-zinc-500">Your cart is empty.</p>
                ) : (
                  <ul className="space-y-4">
                    {lines.map((line) => (
                      <li
                        key={line.shopItemId}
                        className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3"
                      >
                        <img
                          src={line.imageUrl}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold text-white">{line.title}</p>
                          <p className="text-xs text-zinc-500">${line.price.toFixed(2)} each</p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQty(line.shopItemId, line.quantity - 1)}
                              className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:bg-white/5"
                              aria-label="Decrease"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-white">{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQty(line.shopItemId, line.quantity + 1)}
                              disabled={line.quantity >= line.maxStock}
                              className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:bg-white/5 disabled:opacity-40"
                              aria-label="Increase"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLine(line.shopItemId)}
                              className="ml-auto rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="font-mono text-xl font-black text-white">${subtotal.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  disabled={lines.length === 0 || checkoutLoading}
                  onClick={openCheckoutDetails}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-vpulse py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 hover:text-black disabled:opacity-40"
                >
                  {checkoutLoading ? 'Processing…' : 'Checkout with balance'}
                </button>
                {!user && (
                  <p className="text-center text-[10px] text-zinc-500">
                    <Link to="/login" className="text-cyan-vpulse hover:underline">
                      Sign in
                    </Link>{' '}
                    to purchase.
                  </p>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Purchase history */}
      <AnimatePresence>
        {purchasesOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm"
              aria-label="Close purchases overlay"
              onClick={() => setPurchasesOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-[140] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-vpulse" />
                  <span className="text-lg font-black uppercase tracking-tight text-white">My Purchases</span>
                  {!purchasesLoading && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-zinc-400">
                      {purchases.length} {purchases.length === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPurchasesOpen(false)}
                  className="rounded-full p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {purchasesLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-vpulse border-t-transparent" />
                  </div>
                ) : purchases.length === 0 ? (
                  <p className="py-12 text-center text-sm text-zinc-500">No purchases yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {purchases.map((row) => {
                      const when = row.created_at
                        ? new Date(row.created_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '';
                      const imgSrc =
                        row.image_url.trim() ||
                        `https://picsum.photos/seed/order-${encodeURIComponent(row.id.slice(0, 8))}/200/200`;
                      return (
                        <li
                          key={row.id}
                          className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3"
                        >
                          <img
                            src={imgSrc}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-bold text-white">{row.title}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                              {row.category}
                              {row.seller_username ? ` · @${row.seller_username}` : ''}
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">
                              Qty {row.quantity} × ${row.unit_price.toFixed(2)}
                            </p>
                            {row.shipping_snapshot?.full_name ? (
                              <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
                                Ship to: {row.shipping_snapshot.full_name},{' '}
                                {[
                                  row.shipping_snapshot.city,
                                  row.shipping_snapshot.state,
                                  row.shipping_snapshot.postal_code,
                                ]
                                  .filter(Boolean)
                                  .join(', ')}{' '}
                                {row.shipping_snapshot.country}
                              </p>
                            ) : null}
                            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                              <span className="font-mono text-sm font-black text-white">
                                ${row.total.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-zinc-500">{when}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border-t border-white/10 p-5">
                <p className="text-center text-[10px] text-zinc-500">
                  Last 50 checkout line items (newest first).
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex justify-center pt-8">
        <div className="flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-white/5 bg-indigo-600/10 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neon-purple text-white shadow-lg">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Elevate pulse</h3>
          <p className="text-xs font-bold uppercase tracking-tight text-zinc-500">
            Purchases deduct from your pulse balance and pay creators instantly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Shop;
