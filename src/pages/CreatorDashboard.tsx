import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  DollarSign, 
  BarChart2, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Plus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

const data = [
  { name: 'Mon', views: 4000, revenue: 2400 },
  { name: 'Tue', views: 3000, revenue: 1398 },
  { name: 'Wed', views: 2000, revenue: 9800 },
  { name: 'Thu', views: 2780, revenue: 3908 },
  { name: 'Fri', views: 1890, revenue: 4800 },
  { name: 'Sat', views: 2390, revenue: 3800 },
  { name: 'Sun', views: 3490, revenue: 4300 },
];

const CreatorDashboard = () => {
  const stats = [
    { label: 'Total Views', value: '1.2M', growth: '+12.5%', isUp: true, icon: Eye, color: 'text-cyan-vpulse' },
    { label: 'Subscribers', value: '45,200', growth: '+5.2%', isUp: true, icon: Users, color: 'text-purple-vpulse' },
    { label: 'Total Earnings', value: '$12,450', growth: '-2.1%', isUp: false, icon: DollarSign, color: 'text-green-500' },
    { label: 'Pulse Volume', value: '254K', growth: '+18.4%', isUp: true, icon: TrendingUp, color: 'text-orange-500' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Creator Central</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Welcome back, Alex. Your channel is growing faster than average today.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/5 px-6 py-3 text-sm font-bold hover:bg-white/10 transition-all">
            Download Report
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white text-black px-6 py-3 text-sm font-bold hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 active:scale-95">
            <Plus className="h-4 w-4" />
            Upload Video
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-obsidian border border-white/5 shadow-xl space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-black ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
                {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.growth}
              </div>
            </div>
            <div>
              <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-none mb-1">{stat.label}</h3>
              <p className="text-2xl font-black tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 lg:p-8 rounded-2xl bg-obsidian border border-white/5 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-cyan-vpulse" />
              Viewing Performance
            </h3>
            <select className="bg-white/5 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F2FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00F2FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#161618', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px'}}
                  itemStyle={{color: '#fff'}}
                />
                <Area type="monotone" dataKey="views" stroke="#00F2FF" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 lg:p-8 rounded-2xl bg-obsidian border border-white/5 shadow-xl space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
             <TrendingUp className="h-5 w-5 text-purple-vpulse" />
             Top Markets
          </h3>
          <div className="space-y-6">
            {[
              { label: 'BTC Moon', prob: 68, vol: '$1.2M', color: '#00F2FF' },
              { label: 'World Cup Fin', prob: 42, vol: '$850K', color: '#7000FF' },
              { label: 'Election Win', prob: 25, vol: '$2.4M', color: '#FF00E5' },
              { label: 'AI Superint', prob: 88, vol: '$450K', color: '#10b981' },
            ].map((market, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{market.label}</span>
                      <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{market.vol} Vol</span>
                   </div>
                   <span className="text-xs font-mono font-bold" style={{color: market.color}}>{market.prob}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${market.prob}%` }}
                    transition={{ delay: i * 0.1, duration: 1 }}
                    className="h-full rounded-full" 
                    style={{backgroundColor: market.color}} 
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-3 rounded-xl border border-white/5 bg-white/5 text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-widest">
            View All Markets
          </button>
        </div>
      </div>

      {/* Recent Content Table */}
      <div className="p-6 lg:p-8 rounded-2xl bg-obsidian border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold tracking-tight">Recent Content</h3>
           <button className="text-sm font-bold text-cyan-vpulse hover:underline">Manage All</button>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <th className="pb-4 pr-4">Content</th>
                <th className="pb-4 px-4">Type</th>
                <th className="pb-4 px-4">Views</th>
                <th className="pb-4 px-4">Engagement</th>
                <th className="pb-4 px-4">Status</th>
                <th className="pb-4 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3].map((_, i) => (
                <tr key={i} className="border-b border-white/5 group hover:bg-white/5 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-20 rounded-lg bg-zinc-800 overflow-hidden border border-white/5">
                        <img src={`https://picsum.photos/seed/thumb${i}/100/100`} alt="thumb" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white leading-tight">Mastering the Pulse Markets #{i+1}</span>
                        <span className="text-[10px] text-zinc-500">Oct {20 - i}, 2026</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-zinc-400">VIDEO</td>
                  <td className="py-4 px-4 font-bold text-zinc-300">{(125 * (i+1)).toLocaleString()}</td>
                  <td className="py-4 px-4">
                     <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-cyan-vpulse w-[75%]" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500">75%</span>
                     </div>
                  </td>
                  <td className="py-4 px-4 shadow-none">
                     <span className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-black text-green-500 uppercase">Live</span>
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-all">
                      <MoreVertical className="h-4 w-4 text-zinc-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
