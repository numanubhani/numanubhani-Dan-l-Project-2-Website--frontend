import { api } from './api';
import type { ShopItem, ShopPurchaseRow } from '../types';

/** Must match backend `shipping` on POST /shop/checkout/ */
export type ShippingCheckoutPayload = {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export function normalizeShopItem(raw: Record<string, unknown>): ShopItem {
  const price = raw.price;
  const p = typeof price === 'string' ? parseFloat(price) : Number(price);
  return {
    id: String(raw.id ?? ''),
    seller: String(raw.seller ?? ''),
    seller_name: raw.seller_name != null ? String(raw.seller_name) : undefined,
    seller_username: raw.seller_username != null ? String(raw.seller_username) : undefined,
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    category: String(raw.category ?? 'Apparel'),
    stock: Number(raw.stock ?? 0),
    price: Number.isFinite(p) ? p : 0,
    image_url: String(raw.image_url ?? ''),
    status: String(raw.status ?? 'active'),
    created_at: raw.created_at != null ? String(raw.created_at) : undefined,
  };
}

export async function fetchMarketplace(params?: { category?: string; q?: string }): Promise<ShopItem[]> {
  const { data } = await api.get<unknown[]>('/shop/items/', {
    params: {
      category: params?.category && params.category !== 'All' ? params.category : undefined,
      q: params?.q || undefined,
    },
  });
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeShopItem(row as Record<string, unknown>));
}

export async function createShopItem(payload: {
  title: string;
  description?: string;
  category: string;
  stock: number;
  price: number;
  /** Optional listing image (multipart upload). */
  image?: File | null;
}): Promise<ShopItem> {
  const fd = new FormData();
  fd.append('title', payload.title);
  fd.append('description', payload.description ?? '');
  fd.append('category', payload.category);
  fd.append('stock', String(payload.stock));
  fd.append('price', String(payload.price));
  if (payload.image instanceof File && payload.image.size > 0) {
    fd.append('image', payload.image);
  }
  const { data } = await api.post<unknown>('/shop/items/', fd);
  return normalizeShopItem(data as Record<string, unknown>);
}

export interface CheckoutResult {
  total: string;
  purchases: unknown[];
}

export async function checkoutCart(
  items: { shopItemId: string; quantity: number }[],
  shipping: ShippingCheckoutPayload,
): Promise<CheckoutResult> {
  const { data } = await api.post<{ total: string; purchases: unknown[] }>('/shop/checkout/', {
    items: items.map((i) => ({ shopItemId: i.shopItemId, quantity: i.quantity })),
    shipping,
  });
  return { total: data.total, purchases: data.purchases || [] };
}

function normalizeShopPurchase(raw: Record<string, unknown>): ShopPurchaseRow {
  const unit = raw.unit_price;
  const tot = raw.total;
  const up = typeof unit === 'string' ? parseFloat(unit) : Number(unit);
  const t = typeof tot === 'string' ? parseFloat(tot) : Number(tot);
  const snap = raw.shipping_snapshot;
  const shipping_snapshot =
    snap && typeof snap === 'object' && !Array.isArray(snap)
      ? (snap as Record<string, string>)
      : undefined;
  return {
    id: String(raw.id ?? ''),
    shop_item: String(raw.shop_item ?? ''),
    title: String(raw.title ?? ''),
    category: String(raw.category ?? ''),
    image_url: String(raw.image_url ?? ''),
    seller_username: String(raw.seller_username ?? ''),
    quantity: Number(raw.quantity ?? 0),
    unit_price: Number.isFinite(up) ? up : 0,
    total: Number.isFinite(t) ? t : 0,
    created_at: String(raw.created_at ?? ''),
    shipping_snapshot,
  };
}

export async function fetchMyPurchases(): Promise<ShopPurchaseRow[]> {
  const { data } = await api.get<unknown[]>('/shop/purchases/');
  if (!Array.isArray(data)) return [];
  return data.map((row) => normalizeShopPurchase(row as Record<string, unknown>));
}
