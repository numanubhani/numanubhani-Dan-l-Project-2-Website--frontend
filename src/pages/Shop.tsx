import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  ChevronRight, 
  Tag, 
  Star, 
  ShoppingCart,
  Zap,
  TrendingUp,
  Filter
} from 'lucide-react';
import { mockProducts } from '../mockData';
import { motion } from 'motion/react';

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Apparel', 'Gear', 'Digital', 'Collectibles', 'PULSE Pack'];

  return (
    <div className="p-4 lg:p-8 space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-purple-vpulse/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-purple-vpulse" />
             </div>
             <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Marketplace</h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight">Equip your channel. Support your favorite creators.</p>
        </div>

        <div className="flex items-center gap-4">
           <button className="relative group">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-all">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-vpulse text-[10px] font-black text-black">
                0
              </span>
           </button>
           <button className="flex items-center gap-2 rounded-xl bg-white text-black px-6 py-3 text-sm font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-xl">
             My Purchases
           </button>
        </div>
      </div>

      {/* Featured Banner */}
      <div className="relative h-[250px] w-full rounded-[32px] overflow-hidden group border border-white/5 shadow-2xl">
         <img src="https://picsum.photos/seed/merch/1200/400" alt="merch" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
         <div className="absolute inset-0 bg-gradient-to-r from-void via-void/30 to-transparent" />
         <div className="absolute inset-x-10 bottom-10 space-y-4 max-w-lg">
            <div className="flex items-center gap-2">
               <Tag className="h-4 w-4 text-purple-vpulse" />
               <span className="text-xs font-black uppercase tracking-widest text-white/60">Limited Edition Release</span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">THE PULSE DROP</h2>
            <button className="flex items-center gap-2 text-sm font-bold text-cyan-vpulse hover:underline transition-all">
               Shop Collection <ChevronRight className="h-4 w-4" />
            </button>
         </div>
      </div>

      {/* Filtering */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 border-b border-white/5 pb-8">
        <div className="flex-1 no-scrollbar overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat 
                  ? "bg-purple-vpulse text-white shadow-xl shadow-purple-500/20" 
                  : "bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-purple-vpulse transition-colors" />
            <input 
              placeholder="Search gear..." 
              className="w-full md:w-64 rounded-xl bg-white/5 border border-white/10 py-3 pl-11 pr-4 text-sm outline-none focus:border-purple-vpulse/50 transition-all font-medium"
            />
          </div>
          <button className="rounded-xl border border-white/10 p-3 hover:bg-white/5 transition-all">
            <Filter className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {mockProducts.map((product) => (
          <motion.div 
            key={product.id}
            whileHover={{ y: -8 }}
            className="group flex flex-col gap-4 rounded-3xl bg-obsidian border border-white/5 p-4 shadow-xl hover:border-purple-vpulse/20 transition-all"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/5">
               <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
               <div className="absolute top-3 left-3 flex gap-2">
                  <div className="rounded-full bg-void/60 px-3 py-1 backdrop-blur-md text-[10px] font-black uppercase text-cyan-vpulse border border-cyan-vpulse/20">
                     New Arrival
                  </div>
               </div>
               <button className="absolute bottom-3 right-3 rounded-full bg-white p-3 text-black opacity-0 shadow-2xl transition-all group-hover:opacity-100 hover:scale-110 active:scale-95">
                  <ShoppingCart className="h-5 w-5" />
               </button>
            </div>
            <div className="flex flex-col gap-1 px-1">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{product.category}</span>
                  <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-black">
                     <Star className="h-3 w-3 fill-yellow-500" /> 4.9
                  </div>
               </div>
               <h3 className="text-lg font-bold text-white group-hover:text-purple-vpulse transition-colors leading-tight">
                  {product.name}
               </h3>
               <div className="mt-2 flex items-center justify-between">
                  <span className="text-xl font-black text-white tracking-tighter">${product.price.toFixed(2)}</span>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-purple-vpulse tracking-tighter shadow-sm">
                     Earn 12 Pulses <TrendingUp className="h-3 w-3" />
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
        {/* Fillers */}
        {[...mockProducts, ...mockProducts].map((product, i) => (
          <motion.div 
            key={`${product.id}-${i}`}
            whileHover={{ y: -8 }}
            className="group flex flex-col gap-4 rounded-3xl bg-obsidian border border-white/5 p-4 shadow-xl hover:border-purple-vpulse/20 transition-all"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/5">
               <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
               <button className="absolute bottom-3 right-3 rounded-full bg-white p-3 text-black opacity-0 shadow-2xl transition-all group-hover:opacity-100 hover:scale-110 active:scale-95">
                  <ShoppingCart className="h-5 w-5" />
               </button>
            </div>
            <div className="flex flex-col gap-1 px-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{product.category}</span>
               <h3 className="text-lg font-bold text-white group-hover:text-purple-vpulse transition-colors leading-tight">
                  {product.name}
               </h3>
               <span className="mt-2 text-xl font-black text-white px-1 tracking-tighter">${product.price.toFixed(2)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
