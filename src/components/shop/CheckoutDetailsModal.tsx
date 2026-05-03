import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { User } from '../../types';
import type { ShippingCheckoutPayload } from '../../services/shopApi';

const emptyForm: ShippingCheckoutPayload = {
  full_name: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
};

type CheckoutDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  subtotal: number;
  loading: boolean;
  onConfirm: (shipping: ShippingCheckoutPayload) => Promise<void>;
};

export function CheckoutDetailsModal({
  open,
  onOpenChange,
  user,
  subtotal,
  loading,
  onConfirm,
}: CheckoutDetailsModalProps) {
  const [form, setForm] = useState<ShippingCheckoutPayload>(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...prev,
      full_name: (user?.name || '').trim() || prev.full_name,
      email: (user?.email || '').trim() || prev.email,
    }));
  }, [open, user?.name, user?.email]);

  const update = (key: keyof ShippingCheckoutPayload, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(form);
  };

  const fieldCls =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-vpulse/60';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-zinc-950 p-0 sm:max-w-lg">
        <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
          <DialogHeader className="shrink-0 border-b border-white/10 p-6 pb-4 text-left">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">
              Delivery and contact
            </DialogTitle>
            <p className="text-xs font-medium text-zinc-500">
              Order total <span className="font-mono font-black text-white">${subtotal.toFixed(2)}</span> will be
              charged to your Pulse balance.
            </p>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Full name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  className={fieldCls}
                  value={form.full_name}
                  onChange={(ev) => update('full_name', ev.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="email"
                  className={fieldCls}
                  value={form.email}
                  onChange={(ev) => update('email', ev.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="tel"
                  className={fieldCls}
                  value={form.phone}
                  onChange={(ev) => update('phone', ev.target.value)}
                  placeholder="+1 555 000 0000"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Shipping address</p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Address line 1 <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    className={fieldCls}
                    value={form.address_line1}
                    onChange={(ev) => update('address_line1', ev.target.value)}
                    placeholder="Street, building, unit"
                    autoComplete="address-line1"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Address line 2 <span className="text-zinc-700">(optional)</span>
                  </label>
                  <input
                    className={fieldCls}
                    value={form.address_line2}
                    onChange={(ev) => update('address_line2', ev.target.value)}
                    placeholder="Apt, suite, floor"
                    autoComplete="address-line2"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      className={fieldCls}
                      value={form.city}
                      onChange={(ev) => update('city', ev.target.value)}
                      autoComplete="address-level2"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      State / region <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      className={fieldCls}
                      value={form.state}
                      onChange={(ev) => update('state', ev.target.value)}
                      autoComplete="address-level1"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Postal code <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      className={fieldCls}
                      value={form.postal_code}
                      onChange={(ev) => update('postal_code', ev.target.value)}
                      autoComplete="postal-code"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Country <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      className={fieldCls}
                      value={form.country}
                      onChange={(ev) => update('country', ev.target.value)}
                      placeholder="United States"
                      autoComplete="country-name"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 p-6 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full rounded-xl bg-cyan-vpulse py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 hover:text-black disabled:opacity-50',
              )}
            >
              {loading ? 'Processing…' : 'Pay with Pulse balance'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className="py-2 text-xs font-bold text-zinc-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
