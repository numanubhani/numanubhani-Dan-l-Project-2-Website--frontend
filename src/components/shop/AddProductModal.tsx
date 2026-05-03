import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ImagePlus, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { createShopItem } from '../../services/shopApi';
import type { ShopItem } from '../../types';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Apparel', 'Gear', 'Digital', 'Collectibles', 'PULSE Pack'] as const;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: ShopItem) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Apparel');
  const [stock, setStock] = useState(50);
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setCategory('Apparel');
      setStock(50);
      setPrice('');
      setImageFile(null);
      setImagePreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const p = parseFloat(price);
    if (!t) {
      toast.error('Title required');
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      toast.error('Enter a valid price');
      return;
    }
    if (imageFile) {
      const maxBytes = 5 * 1024 * 1024;
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (imageFile.size > maxBytes) {
        toast.error('Image too large', { description: 'Use a file under 5 MB.' });
        return;
      }
      if (!allowed.includes(imageFile.type)) {
        toast.error('Unsupported image type', {
          description: 'Use JPEG, PNG, WebP, or GIF.',
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const item = await createShopItem({
        title: t,
        description: description.trim(),
        category,
        stock: Math.max(0, Math.floor(stock)),
        price: p,
        image: imageFile,
      });
      onCreated(item);
      toast.success('Product listed', { description: 'Your item is live in the marketplace.' });
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { detail?: string } } };
      if (ax.response?.status === 401) {
        toast.error('Sign in required', { description: 'Log in to list products.' });
        return;
      }
      const d = ax.response?.data?.detail;
      toast.error('Could not create listing', {
        description: typeof d === 'string' ? d : 'Try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => !submitting && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-purple-vpulse/30 bg-zinc-950 p-6 shadow-2xl shadow-purple-500/10"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-vpulse/20">
                  <ShoppingBag className="h-6 w-6 text-purple-vpulse" />
                </div>
                <h2 className="text-lg font-black uppercase italic tracking-tight text-white">Add product</h2>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="rounded-full border border-white/10 p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-purple-vpulse/50"
                  placeholder="VPULSE Hoodie"
                  maxLength={255}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-purple-vpulse/50"
                  placeholder="Short description"
                />
              </div>
              <div>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Category
                </span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                        category === c
                          ? 'border-purple-vpulse bg-purple-vpulse text-white'
                          : 'border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-white',
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-purple-vpulse/50"
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-purple-vpulse/50"
                  />
                </div>
              </div>
              <div>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Photo <span className="font-normal normal-case text-zinc-600">(optional)</span>
                </span>
                <input
                  ref={fileInputRef}
                  id="add-product-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setImageFile(f ?? null);
                  }}
                  tabIndex={-1}
                  aria-label="Choose product photo file"
                />
                <div className="flex gap-4">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={imagePreviewUrl ? 'Replace product photo' : 'Choose product photo'}
                    className="flex h-28 w-28 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 text-zinc-400 hover:border-purple-vpulse/40 hover:bg-white/[0.07] hover:text-white"
                  >
                    {imagePreviewUrl ? (
                      <img src={imagePreviewUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="mb-1 h-7 w-7" />
                        <span className="px-1 text-[9px] font-black uppercase tracking-wider">Upload</span>
                      </>
                    )}
                  </button>
                  <div className="flex min-h-[7rem] flex-1 flex-col justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-zinc-500">
                    <p>JPEG, PNG, WebP, or GIF · max 5 MB</p>
                    {imageFile && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          setImageFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="mt-3 w-fit text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-white/10 py-3 text-xs font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-purple-vpulse py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-purple-400 disabled:opacity-50"
                >
                  {submitting ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
