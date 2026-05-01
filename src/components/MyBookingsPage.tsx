import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Truck, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Booking, FoodTruck } from '../types';
import { formatCurrency } from '../lib/utils';

interface MyBookingsPageProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  trucks: FoodTruck[];
}

export function MyBookingsPage({ isOpen, onClose, bookings, trucks }: MyBookingsPageProps) {
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="glass-card w-full h-full sm:h-[90vh] sm:max-w-4xl sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative"
      >
        <div className="glass px-6 py-5 border-b border-white/20 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900  tracking-tight">Mening Bronlarim</h2>
            <p className="text-sm text-slate-900   font-bold mt-1">Jami: {bookings.length} ta bron</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 text-slate-900  rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-slate-900   font-bold" />
              </div>
              <h3 className="text-xl font-bold text-slate-900  mb-2">Hozircha bronlar yo'q</h3>
              <p className="text-slate-900   font-bold">Siz hali birorta ham avtomobil bron qilmadingiz.</p>
              <button 
                onClick={onClose}
                className="mt-6 bg-[#FF9500] text-slate-900  px-8 py-3 rounded-full font-semibold hover:bg-[#cc7700] transition-colors"
              >
                Avtomobil izlash
              </button>
            </div>
          ) : (
            bookings.map(booking => {
              const truck = trucks.find(t => t.id === booking.truckId);
              const start = new Date(booking.startDate).getTime();
              const end = new Date(booking.endDate).getTime();
              
              const isOngoing = now >= start && now <= end;
              const isPast = now > end;
              const isUpcoming = now < start;
              
              const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
              const daysToStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

              return (
                <div key={booking.id} className="glass-card rounded-[24px] p-5 shadow-lg border border-white/20 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
                  {booking.paymentStatus === 'unpaid' && (
                    <div className="absolute top-0 right-0 bg-[#FF3B30] text-slate-900  text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl z-10">
                      To'lov qilinmagan
                    </div>
                  )}
                  {booking.paymentStatus === 'paid' && (
                    <div className="absolute top-0 right-0 bg-[#34C759] text-slate-900  text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl z-10">
                      To'langan
                    </div>
                  )}

                  {/* Truck Info */}
                  <div className="flex gap-4 sm:w-1/3">
                    <div className="w-20 h-20 rounded-[16px] bg-slate-100 flex-shrink-0 overflow-hidden relative">
                       {truck?.photoUrl ? (
                         <img src={truck.photoUrl} alt={truck.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-900   font-bold">
                           <Truck className="w-8 h-8" />
                         </div>
                       )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900  text-lg leading-tight mb-1">{truck?.name || 'Kutilmoqda...'}</h4>
                      <p className="text-sm text-slate-900   font-bold mb-2 truncate max-w-[150px]">{truck?.address}</p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-900  text-xs font-semibold">
                         <Calendar className="w-3.5 h-3.5" />
                         <span>{(end - start) / (1000 * 60 * 60 * 24)} kun</span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Status & Timeline */}
                  <div className="flex-1 flex flex-col justify-center sm:border-l border-black/5 sm:pl-6">
                    <div className="flex flex-col gap-3">
                      
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-slate-900   font-bold">Holat:</span>
                         <span className={`text-sm font-bold shadow-sm px-3 py-1 rounded-full ${
                            booking.status === 'pending' ? "bg-[#FF9500]/10 text-slate-900  inline-block drop-shadow-md" :
                            booking.status === 'confirmed' ? "bg-[#007AFF]/10 text-[#007AFF]" :
                            booking.status === 'completed' ? "bg-[#34C759]/10 text-[#34C759]" :
                            "bg-[#FF3B30]/10 text-[#FF3B30]"
                         }`}>
                            {booking.status === 'pending' ? 'Kutilmoqda' :
                             booking.status === 'confirmed' ? 'Tasdiqlangan' :
                             booking.status === 'completed' ? 'Yakunlangan' : 'Bekor qilingan'}
                         </span>
                      </div>

                      <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-slate-900   font-bold">Muddati:</span>
                         <span className="text-sm text-slate-900 ">
                           {new Date(start).toLocaleDateString()} - {new Date(end).toLocaleDateString()}
                         </span>
                      </div>

                      <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-slate-900   font-bold">Umumiy narx:</span>
                         <span className="text-sm font-bold text-slate-900  inline-block drop-shadow-md">
                           {formatCurrency(booking.totalPrice)} so'm
                         </span>
                      </div>

                    </div>
                  </div>

                  {/* Alerts / Actions */}
                  <div className="sm:w-1/4 flex flex-col justify-center sm:border-l border-black/5 sm:pl-6 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0">
                     {booking.paymentStatus === 'unpaid' && booking.status !== 'cancelled' && (
                       <div className="bg-[#FF3B30]/10 p-3 rounded-xl border border-[#FF3B30]/20 flex flex-col items-center text-center gap-2">
                         <AlertCircle className="w-6 h-6 text-[#FF3B30]" />
                         <p className="text-xs text-[#FF3B30] font-medium leading-tight">To'lovni amalga oshirish uchun admin bilan bog'laning</p>
                       </div>
                     )}

                     {booking.paymentStatus === 'paid' && isOngoing && (
                       <div className="bg-[#FF9500]/10 p-3 rounded-xl border border-[#FF9500]/20 flex flex-col items-center text-center gap-2">
                         <Clock className="w-6 h-6 text-slate-900  inline-block drop-shadow-md" />
                         <p className="text-xs text-slate-900  inline-block drop-shadow-md font-medium leading-tight">Ijaraga olingan. Tugashiga <b>{Math.max(0, daysLeft)} kun</b> qoldi.</p>
                       </div>
                     )}

                     {booking.paymentStatus === 'paid' && isUpcoming && (
                       <div className="bg-[#007AFF]/10 p-3 rounded-xl border border-[#007AFF]/20 flex flex-col items-center text-center gap-2">
                         <CheckCircle2 className="w-6 h-6 text-[#007AFF]" />
                         <p className="text-xs text-[#007AFF] font-medium leading-tight">Ijara boshlanishiga <b>{Math.max(0, daysToStart)} kun</b> qoldi.</p>
                       </div>
                     )}

                     {booking.status === 'completed' && (
                       <div className="bg-[#34C759]/10 p-3 rounded-xl border border-[#34C759]/20 flex flex-col items-center text-center gap-2">
                         <CheckCircle2 className="w-6 h-6 text-[#34C759]" />
                         <p className="text-xs text-[#34C759] font-medium leading-tight">Ijara yakunlangan. Rahmat!</p>
                       </div>
                     )}

                     {booking.paymentStatus === 'paid' && (
                       <button className="mt-3 w-full border border-[#007AFF] text-[#007AFF] hover:bg-[#007AFF]/10 py-2 rounded-xl text-xs font-bold transition-colors">
                          Kvitansiyani yuklash
                       </button>
                     )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
