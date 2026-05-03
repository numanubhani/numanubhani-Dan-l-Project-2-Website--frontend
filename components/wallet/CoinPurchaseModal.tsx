import * as React from 'react';
import { Coins, Check } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/src/services/api';
import { useAuth } from '@/src/contexts/AuthContext';

/** Dev / placeholder: amount added to Pulse balance when user confirms a coin pack. */
const HARDCODE_PURCHASE_TOPUP_USD = 10_000;

export interface CoinPlan {
  id: string;
  coins: number;
  price: number;
  popular?: boolean;
}

const DEFAULT_PLANS: CoinPlan[] = [
  { id: 'plan1', coins: 1000, price: 15 },
  { id: 'plan2', coins: 2000, price: 30, popular: true },
  { id: 'plan3', coins: 5000, price: 75 },
];

interface CoinPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans?: CoinPlan[];
}

export function CoinPurchaseModal({
  open,
  onOpenChange,
  plans = DEFAULT_PLANS,
}: CoinPurchaseModalProps) {
  const defaultPlanId =
    plans.find((p) => p.popular)?.id ?? plans[1]?.id ?? plans[0]?.id ?? '';

  const [selectedPlanId, setSelectedPlanId] = React.useState(defaultPlanId);
  const [topUpPending, setTopUpPending] = React.useState(false);
  const { user, refreshProfile } = useAuth();

  React.useEffect(() => {
    if (!open || plans.length === 0) return;
    const fallback = plans.find((p) => p.popular)?.id ?? plans[0].id;
    setSelectedPlanId((prev) => (plans.some((p) => p.id === prev) ? prev : fallback));
  }, [open, plans]);

  const selected = plans.find((p) => p.id === selectedPlanId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-white/10 bg-zinc-950 sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-10 text-2xl font-black tracking-tight text-white">
            <Coins className="h-6 w-6 text-amber-coin shrink-0" />
            Purchase coins
          </DialogTitle>
          <p className="text-sm text-zinc-500">
            Pick a Pulse coin pack. Larger packs cost less per 100 coins.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlanId(plan.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPlanId(plan.id);
                }
              }}
              className={cn(
                'relative flex cursor-pointer flex-col rounded-3xl border-2 p-6 transition-all outline-none hover:border-neon-cyan/40 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-neon-cyan/50',
                selectedPlanId === plan.id
                  ? 'border-neon-cyan bg-neon-cyan/5 shadow-md shadow-neon-cyan/10'
                  : 'border-white/10 bg-white/[0.02]',
              )}
            >
              {plan.popular ? (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap">
                  <span className="rounded-full bg-amber-coin px-4 py-1 text-xs font-black uppercase tracking-wide text-black">
                    Most popular
                  </span>
                </div>
              ) : null}

              <div className="mb-4 flex justify-center">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 p-1 transition-colors',
                    selectedPlanId === plan.id ? 'border-neon-cyan' : 'border-white/15',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full transition-opacity',
                      selectedPlanId === plan.id ? 'bg-neon-cyan opacity-100' : 'opacity-0',
                    )}
                  >
                    <Check className="h-5 w-5 text-black" />
                  </div>
                </div>
              </div>

              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-2 flex items-center gap-2">
                  <Coins className="h-8 w-8 shrink-0 text-amber-coin" />
                  <h3 className="text-3xl font-black text-white">{plan.coins.toLocaleString()}</h3>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Coins</p>
              </div>

              <div className="mb-6 flex flex-col items-center">
                <div className="flex items-baseline">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  ${((plan.price / plan.coins) * 100).toFixed(2)} per 100 coins
                </p>
              </div>

              <ul className="mb-6 space-y-3">
                <li className="flex items-center gap-2 text-sm text-zinc-300">
                  <Check className="h-4 w-4 shrink-0 text-neon-cyan" /> Instant delivery
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-300">
                  <Check className="h-4 w-4 shrink-0 text-neon-cyan" /> No expiration
                </li>
                <li className="flex items-center gap-2 text-sm text-zinc-300">
                  <Check className="h-4 w-4 shrink-0 text-neon-cyan" /> Secure payment
                </li>
              </ul>

              <button
                type="button"
                className={cn(
                  'w-full rounded-xl py-3 text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98]',
                  selectedPlanId === plan.id
                    ? 'bg-neon-cyan text-black hover:brightness-110'
                    : 'border border-white/10 bg-white/5 text-white hover:bg-white/10',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlanId(plan.id);
                }}
              >
                {selectedPlanId === plan.id ? 'Selected' : 'Select plan'}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            disabled={topUpPending}
            onClick={async () => {
              if (!selected) return;
              if (!user) {
                toast.error('Sign in to add funds', { description: 'Log in, then try again.' });
                return;
              }
              setTopUpPending(true);
              try {
                await api.post('/wallet/test-credit/', { amount: HARDCODE_PURCHASE_TOPUP_USD });
                await refreshProfile();
                toast.success('Wallet updated (dev top-up)', {
                  description: `+$${HARDCODE_PURCHASE_TOPUP_USD.toLocaleString()} Pulse balance. Plan: ${selected.coins.toLocaleString()} coins • $${selected.price}.`,
                });
                onOpenChange(false);
              } catch (e: unknown) {
                const ax = e as { response?: { data?: { error?: string; detail?: string } } };
                const msg =
                  ax.response?.data?.error ||
                  ax.response?.data?.detail ||
                  'Could not credit wallet. Is the API running and DEBUG / test wallet enabled?';
                toast.error('Top-up failed', { description: String(msg) });
              } finally {
                setTopUpPending(false);
              }
            }}
            className="w-full rounded-xl bg-neon-cyan py-3 text-sm font-black uppercase tracking-wider text-black transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {topUpPending ? 'Applying…' : 'Continue to payment'}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl py-2 text-sm font-bold text-zinc-500 transition-colors hover:text-white"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
