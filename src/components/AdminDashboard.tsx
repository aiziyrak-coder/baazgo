import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Booking, FoodTruck } from '../types';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Users, Truck, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface AdminDashboardProps {
  bookings: Booking[];
  trucks: FoodTruck[];
}

export function AdminDashboard({ bookings, trucks }: AdminDashboardProps) {
  const stats = useMemo(() => {
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    
    const rentedTrucksCount = trucks.filter(t => t.status === 'rented').length;

    // Daily revenue last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'MMM dd');
      
      const dayBookings = bookings.filter(b => {
        const bDate = new Date(b.createdAt);
        return bDate.getDate() === date.getDate() && bDate.getMonth() === date.getMonth();
      });

      const rev = dayBookings.reduce((sum, b) => b.paymentStatus === 'paid' ? sum + b.totalPrice : sum, 0);

      return {
        name: dateStr,
        daromad: rev,
        bronlar: dayBookings.length
      };
    });

    return { totalRevenue, activeBookings: activeBookings.length, rentedTrucksCount, last7Days };
  }, [bookings, trucks]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[
          { title: "Tushum", value: stats.totalRevenue >= 1000000 ? `${(stats.totalRevenue/1000000).toFixed(1)}M` : `${formatCurrency(stats.totalRevenue)}`, icon: DollarSign, color: "text-[#34C759]", bg: "bg-[#34C759]/10" },
          { title: "Bron", value: stats.activeBookings, icon: Activity, color: "text-[#007AFF]", bg: "bg-[#007AFF]/10" },
          { title: "Ijarada", value: `${stats.rentedTrucksCount}/${trucks.length}`, icon: Truck, color: "text-[#FF9500]", bg: "bg-[#FF9500]/10" },
          { title: "Yangi", value: "+24", icon: Users, color: "text-[#AF52DE]", bg: "bg-[#AF52DE]/10" }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.title} 
            className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] shadow-sm border border-black/[0.03] flex flex-col justify-between"
          >
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3 sm:mb-4 shrink-0`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate mb-1">{stat.title}</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 truncate">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-[32px] shadow-sm border border-black/[0.03]"
        >
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-bold text-slate-900">Oxirgi 7 kunlik daromad</h3>
             <span className="bg-[#34C759]/10 text-[#34C759] text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
               <TrendingUp className="w-3 h-3" /> +12.5%
             </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={45} allowDecimals={false} tickFormatter={(val) => {
                  if (val === 0) return '0';
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                  return val.toString();
                }} />
                <Tooltip 
                  cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val: number) => [`${formatCurrency(val)} so'm`, 'Daromad']}
                />
                <Line type="monotone" dataKey="daromad" stroke="#34C759" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: "#34C759", stroke: "#fff", strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[32px] shadow-sm border border-black/[0.03]"
        >
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-bold text-slate-900">Bron qilinish dinamikasi</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={25} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="bronlar" fill="#007AFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 shadow-sm border border-black/[0.03]">
         <div className="flex items-center justify-between mb-4 sm:mb-6">
           <h3 className="text-base sm:text-lg font-bold text-slate-900">So'nggi harakatlar</h3>
         </div>
         <div className="space-y-3 sm:space-y-4">
           {bookings.slice(0, 5).map(b => (
             <div key={b.id} className="flex items-center justify-between py-2 sm:py-3 border-b border-slate-100 last:border-0 gap-2">
               <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                 <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center ${b.status === 'pending' ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#34C759]/10 text-[#34C759]'}`}>
                   {b.status === 'pending' ? <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
                 </div>
                 <div className="min-w-0">
                   <p className="text-sm font-semibold text-slate-900 truncate">Bron #{b.id.replace('booking-', '').slice(-6)}</p>
                   <p className="text-[10px] sm:text-xs text-slate-500 truncate">{new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                 </div>
               </div>
               <div className="text-right shrink-0">
                 <p className="text-xs sm:text-sm font-bold text-slate-900">{b.totalPrice >= 1000000 ? `${(b.totalPrice/1000000).toFixed(1)}M` : formatCurrency(b.totalPrice)} so'm</p>
                 <p className={`text-[10px] sm:text-xs font-semibold ${b.paymentStatus === 'paid' ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                   {b.paymentStatus === 'paid' ? 'To\'landi' : 'Kutilmoqda'}
                 </p>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
