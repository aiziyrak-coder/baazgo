/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  FormEvent,
  startTransition,
  useCallback,
  memo,
} from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Map as MapIcon,
  CreditCard,
  Calendar,
  Truck,
  User as UserIcon,
  X,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LogOut,
  Loader2,
  Heart,
  Star,
  Camera,
  Plus,
  MapPin,
  Filter,
  Users,
  Bell,
  BadgeCheck,
  Moon,
  Sun,
  FileText,
  Shield,
  Building2,
  ListTree,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth, handleFirestoreError } from './hooks/useAuth';
import { FoodTruck, Booking, OperationType, SiteNotification } from './types';
import { generateMockTrucks } from './lib/mockData';
import {
  fetchTrucksFromApi,
  fetchBookingsForUser,
  createBookingOnApi,
} from './lib/api/platformApi';
import { cn, formatCurrency } from './lib/utils';
import { useDarkMode } from './lib/useDarkMode';
import { useIsNarrowViewport } from './hooks/useIsNarrowViewport';
import { AdminDashboard } from './components/AdminDashboard';
import { MyBookingsPage } from './components/MyBookingsPage';

// Custom Map Marker Icons (Cached)
const createMapIcon = (color: string) => L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div class="animate-marker" style="
      width: 32px;
      height: 32px;
      background-color: ${color};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      border: 3px solid white;
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 17h4V5H2v12h3"></path>
        <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"></path>
        <path d="M14 17h1"></path>
        <circle cx="7.5" cy="17.5" r="2.5"></circle>
        <circle cx="17.5" cy="17.5" r="2.5"></circle>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconAvailable = createMapIcon('#34C759'); // Green
const iconRented = createMapIcon('#FF3B30'); // Red
const iconFinishingSoon = createMapIcon('#FF9500'); // Orange

const createCustomIcon = (status: string) => {
  if (status === 'available') return iconAvailable;
  if (status === 'finishing_soon') return iconFinishingSoon;
  return iconRented;
};

const MapUpdater = ({ userLocation }: { userLocation: {lat: number, lng: number} | null }) => {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 12);
    }
  }, [userLocation, map]);
  return null;
};

/** iOS Safari: flex + dvh often leaves Leaflet with a tiny box until invalidateSize runs. */
function LeafletResizeBridge() {
  const map = useMap();
  useEffect(() => {
    const fix = () => {
      map.invalidateSize({ animate: false });
    };
    fix();
    const raf = requestAnimationFrame(fix);
    const t1 = window.setTimeout(fix, 50);
    const t2 = window.setTimeout(fix, 300);
    const onVis = () => {
      if (document.visibilityState === 'visible') fix();
    };
    window.addEventListener('resize', fix);
    window.addEventListener('orientationchange', fix);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', fix);
      window.removeEventListener('orientationchange', fix);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [map]);
  return null;
}

/** Memoized marker — avoids reconciling hundreds of markers when opening the preview card. */
const TruckMapMarker = memo(function TruckMapMarker({
  truck,
  onSelect,
}: {
  truck: FoodTruck;
  onSelect: (t: FoodTruck) => void;
}) {
  return (
    <Marker
      position={[truck.latitude, truck.longitude]}
      icon={createCustomIcon(truck.status)}
      eventHandlers={{
        click: () => onSelect(truck),
      }}
    />
  );
});

export default function App() {
  const { user, profile, loading: authLoading, signInWithPhone, registerWithPhone, logout, loginError } = useAuth();
  const [trucks, setTrucks] = useState<FoodTruck[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<FoodTruck | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<SiteNotification[]>([
    {
      id: 'notif-1',
      title: "Xush kelibsiz!",
      message: "BaazGo uz ilovasiga xush kelibsiz. Eng yaxshi furgonlarni bron qiling.",
      read: false,
      type: 'success',
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-2',
      title: "Yangi imkoniyatlar",
      message: "Endi 14 kunlik bronlar uchun 10% chegirma beriladi.",
      read: false,
      type: 'info',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authPhone, setAuthPhone] = useState('+998 90 123 45 67');
  const [authPassword, setAuthPassword] = useState('demo1234');
  const [authName, setAuthName] = useState('Eshmat Toshmatov');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAdminViewOpen, setIsAdminViewOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'rented' | 'finishing_soon'>('all');
  const [priceRange, setPriceRange] = useState<number>(3000000);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rating_desc' | 'nearest'>('default');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [isRegisteringTruck, setIsRegisteringTruck] = useState(false);
  
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const isNarrowViewport = useIsNarrowViewport();
  
  const [bookingStartDate, setBookingStartDate] = useState<string>('');
  const [bookingEndDate, setBookingEndDate] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const prevUserBookingsRef = useRef<Booking[]>([]);
  const prevAllBookingsRef = useRef<Booking[]>([]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const notify = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    toast.success(body, {
      duration: 5000,
      position: 'top-center',
      icon: '🔔',
    });
  };

  const toggleFavorite = (truckId: string) => {
    setFavorites(prev => 
      prev.includes(truckId) ? prev.filter(id => id !== truckId) : [...prev, truckId]
    );
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setIsAdminViewOpen(false);
  };
  
  useEffect(() => {
    let cancelled = false;
    const count = isNarrowViewport ? 140 : 450;
    (async () => {
      const remote = await fetchTrucksFromApi(count);
      if (cancelled) return;
      if (remote?.length) {
        setTrucks(remote);
        return;
      }
      setTrucks(generateMockTrucks(count));
    })();
    return () => {
      cancelled = true;
    };
  }, [isNarrowViewport]);

  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    let merged: Booking[] = [];
    const stored = localStorage.getItem('baazgo_bookings');
    if (stored) {
      try {
        merged = JSON.parse(stored) as Booking[];
      } catch {
        merged = [];
      }
    }
    const remote = await fetchBookingsForUser(user.uid);
    if (remote && remote.length > 0) {
      const byId = new Map<string, Booking>();
      for (const b of merged) byId.set(b.id, b);
      for (const b of remote) byId.set(b.id, b);
      merged = Array.from(byId.values());
      localStorage.setItem('baazgo_bookings', JSON.stringify(merged));
    }
    const userBks = merged
      .filter((b) => b.userId === user.uid)
      .sort(
        (a, b) =>
          new Date(b.createdAt as string).getTime() -
          new Date(a.createdAt as string).getTime(),
      );
    setUserBookings(userBks);
    if (profile?.role === 'admin') {
      setAllBookings(merged);
    }
  }, [user, profile]);

  useEffect(() => {
    if (!user) {
      setUserBookings([]);
      setAllBookings([]);
      prevUserBookingsRef.current = [];
      prevAllBookingsRef.current = [];
      return;
    }

    void loadBookings();
    const interval = setInterval(() => void loadBookings(), 15000);
    return () => clearInterval(interval);
  }, [user, profile, loadBookings]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      if (authMode === 'login') {
        await signInWithPhone(authPhone, authPassword);
      } else {
        await registerWithPhone(authPhone, authPassword, authName);
      }
      setIsAuthModalOpen(false);
      setIsSidebarOpen(false);
    } catch (e) {
      // Error is handled in useAuth
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const filteredTrucks = useMemo(() => {
    let result = trucks;
    
    if (activeCategory !== 'all') {
      result = result.filter(t => t.category === activeCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
      );
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }
    
    result = result.filter(t => t.pricePerDay <= priceRange && t.rating >= minRating);
    
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sortBy === 'rating_desc') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'nearest' && userLocation) {
      const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
      };
      result.sort((a, b) => {
        return getDist(userLocation.lat, userLocation.lng, a.latitude, a.longitude) - getDist(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
      });
    }
    
    return result;
  }, [trucks, searchQuery, filterStatus, priceRange, minRating, sortBy, activeCategory, userLocation]);

  const selectTruck = useCallback((truck: FoodTruck) => {
    startTransition(() => setSelectedTruck(truck));
  }, []);

  const clearSelectedTruck = useCallback(() => {
    startTransition(() => setSelectedTruck(null));
  }, []);

  const handleFindNearest = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolokatsiya qo\'llab-quvvatlanmaydi.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setSortBy('nearest');
        setIsLocating(false);
        toast.success("Eng yaqinlari aniqlandi");
      },
      (error) => {
        setIsLocating(false);
        toast.error("Lokatsiyani aniqlab bo'lmadi");
      }
    );
  };

  const handleBooking = async (truck: FoodTruck) => {
    if (!user) {
      alert("Iltimos, avval ro'yxatdan o'ting");
      return;
    }
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setBookingStartDate(today.toISOString().split('T')[0]);
    setBookingEndDate(nextWeek.toISOString().split('T')[0]);
    setPromoCode('');
    setDiscountPercent(0);
    setIsBookingModalOpen(true);
  };

  const confirmBooking = async () => {
    if (!selectedTruck || !user) return;
    setIsBooking(true);
    try {
      const stored = localStorage.getItem('baazgo_bookings');
      const bks: Booking[] = stored ? JSON.parse(stored) : [];

      const start = new Date(bookingStartDate);
      const end = new Date(bookingEndDate);
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );

      let basePrice = selectedTruck.pricePerDay * Math.max(1, days);
      if (days >= 14) basePrice = basePrice * 0.9;
      const finalPrice = basePrice * (1 - discountPercent / 100);

      const newBooking: Booking = {
        id: "booking-" + Date.now(),
        truckId: selectedTruck.id,
        userId: user.uid,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalPrice: finalPrice,
        status: "pending",
        paymentStatus: "unpaid",
        createdAt: new Date().toISOString(),
      };

      const apiResult = await createBookingOnApi(newBooking);
      if (apiResult.conflict) {
        toast.error(
          "Bu sanalar uchun furgon allaqachon band. Boshqa muddat tanlang.",
        );
        return;
      }

      const final = apiResult.booking ?? newBooking;
      const idx = bks.findIndex((x) => x.id === final.id);
      if (idx >= 0) bks[idx] = final;
      else bks.push(final);
      localStorage.setItem("baazgo_bookings", JSON.stringify(bks));

      if (!apiResult.ok) {
        toast(
          "Serverga ulanib bo‘lmadi — bron qurilmangizda saqlandi; keyinroq sinxronlanadi.",
          { icon: "⚠️", duration: 4500 },
        );
      }

      setTrucks((prev) =>
        prev.map((t) =>
          t.id === selectedTruck.id ? { ...t, status: "rented" } : t,
        ),
      );
      void loadBookings();

      alert(
        "Bron muvaffaqiyatli amalga oshirildi!\n\nKeyingi qadamlar:\n1. Avtomobil kalitini filialimizdan olib keting.\n2. Yoki administrator aloqaga chiqishini kuting.",
      );
      setIsBookingModalOpen(false);
    } catch {
      toast.error("Bronni saqlashda xatolik");
    } finally {
      setIsBooking(false);
    }
  };

  if (authLoading) return (
    <div className="h-screen w-screen flex flex-col gap-4 items-center justify-center bg-[#F2F2F7] text-slate-900   font-medium">
      <Loader2 className="w-8 h-8 animate-spin text-slate-900  inline-block drop-shadow-md" />
      <span className="font-medium animate-pulse">Yuklanmoqda...</span>
    </div>
  );

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-screen flex-col overflow-hidden bg-[#F2F2F7]">
      <Toaster />
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-[64px] sm:h-20 pt-[env(safe-area-inset-top)] glass z-[1100] flex items-center justify-between px-4 sm:px-4 border-b border-black/5">
        <div className="flex items-center gap-2">
          <Truck className="text-slate-900  inline-block drop-shadow-md w-6 h-6 sm:w-7 sm:h-7" />
          <span className="font-medium text-[16px] sm:text-lg tracking-tight text-slate-900  block">BaazGo <span className="text-slate-900  inline-block drop-shadow-md font-medium text-[10px] sm:text-xs">UZ</span></span>
        </div>
        
        <div className="hidden sm:flex flex-1 max-w-2xl mx-4 relative gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900   font-medium" />
            <input 
              type="text" 
              placeholder="Qidirish va filterlar..." 
              className="w-full bg-black/5   border border-white/20 rounded-full py-2 pl-9 pr-4 text-sm focus:bg-white/80  focus:ring-1 focus:ring-[#0f172a] transition-all outline-none backdrop-blur-md shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar mask-edges px-2">
            {[
              { id: 'all', label: 'Barchasi', icon: '🍽️' },
              { id: 'fastfood', label: 'Fast Food', icon: '🍔' },
              { id: 'coffee', label: 'Kofe', icon: '☕' },
              { id: 'bbq', label: 'Shashlik', icon: '🍖' },
              { id: 'asian', label: 'Osiyo', icon: '🍜' },
              { id: 'dessert', label: 'Shirinlik', icon: '🍦' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                  activeCategory === cat.id 
                    ? "bg-white/60 backdrop-blur-xl border border-white/80 shadow-md text-slate-800" 
                    : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm"
                )}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex items-center justify-center bg-black/5  hover:bg-black/10  px-4 py-2 rounded-full transition-colors text-slate-900   outline-none focus:ring-2 focus:ring-[#0f172a] border border-white/20 shadow-inner shrink-0"
          >
             <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 text-slate-900   hover:text-slate-900  inline-block drop-shadow-md transition-colors rounded-full bg-black/5  relative">
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                 <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-2 border-white "></span>
              )}
            </button>
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 glass-card rounded-[24px] shadow-2xl border border-white  overflow-hidden z-[5000]"
                >
                  <div className="p-4 border-b border-black/5  flex justify-between items-center">
                    <h3 className="font-medium text-slate-900   font-medium">Xabarnomalar</h3>
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                      className="text-xs font-medium text-[#0f172a] hover:underline"
                    >
                      Barchasini o'qish
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length > 0 ? notifications.map(notif => (
                      <div key={notif.id} className={cn("p-3 rounded-2xl mb-1 transition-colors", notif.read ? "hover:bg-slate-50 " : "bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/5")}>
                         <div className="flex justify-between items-start mb-1">
                           <h4 className={cn("text-sm font-medium", notif.read ? "text-slate-900   font-medium" : "text-slate-900   font-medium")}>{notif.title}</h4>
                           {!notif.read && <span className="w-2 h-2 rounded-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm shrink-0 mt-1.5 ml-2"></span>}
                         </div>
                         <p className="text-xs text-slate-900  mb-1">{notif.message}</p>
                         <p className="text-[10px] text-slate-900   font-medium">{new Date(notif.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    )) : (
                      <div className="p-6 text-center text-slate-900   font-medium text-sm">Xabarnomalar yo'q</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={toggleDarkMode} className="p-2 text-slate-900   hover:text-slate-900  inline-block drop-shadow-md transition-colors rounded-full bg-black/5  hidden sm:flex">
             {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsMobileSearchOpen(true)} className="p-2 sm:hidden text-slate-900  hover:text-slate-900  inline-block drop-shadow-md transition-colors">
            <Search className="w-5 h-5" />
          </button>
          {user ? (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="hidden sm:flex w-10 h-10 rounded-full bg-slate-100 items-center justify-center text-slate-900  hover:bg-slate-200 transition-colors shadow-sm overflow-hidden"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </button>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="hidden sm:flex bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm px-5 py-2 rounded-full text-sm font-medium hover:bg-[#cc7700] transition-all shadow-md active:scale-95 disabled:opacity-70 items-center justify-center gap-2"
            >
              {isAuthenticating && <Loader2 className="w-4 h-4 animate-spin" />}
              Kirish
            </button>
          )}
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 sm:hidden text-slate-900  hover:text-slate-900  inline-block drop-shadow-md transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden max-sm:pb-[calc(5.35rem+env(safe-area-inset-bottom,0px))]">
        {/* Map Area — flex-col + min-h-0 fixes iOS height; inset fills main so Leaflet gets real dimensions */}
        <div className="absolute inset-0 z-0 min-h-0">
          <MapContainer 
            center={[41.2995, 69.2401]} 
            zoom={6} 
            className="map-root h-full w-full"
            zoomControl={false}
            attributionControl={false}
            maxBounds={[[37.0, 56.0], [46.0, 74.0]]}
            maxBoundsViscosity={1.0}
            minZoom={5}
          >
            <LeafletResizeBridge />
            <MapUpdater userLocation={userLocation} />
            <TileLayer
              attribution=""
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              detectRetina={!isNarrowViewport}
            />
            <MarkerClusterGroup
              chunkedLoading
              chunkInterval={isNarrowViewport ? 200 : 120}
              chunkDelay={isNarrowViewport ? 55 : 30}
              maxClusterRadius={isNarrowViewport ? 78 : 56}
              showCoverageOnHover={false}
              spiderfyOnMaxZoom
            >
              {userLocation && (
                <Marker 
                  position={[userLocation.lat, userLocation.lng]}
                  icon={L.divIcon({
                    className: 'bg-transparent border-none',
                    html:
                      `<div class="user-loc-dot" style="width:${isNarrowViewport ? 14 : 16}px;height:${isNarrowViewport ? 14 : 16}px;background:#007AFF;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.28);"></div>`,
                    iconSize: isNarrowViewport ? [14, 14] : [16, 16],
                    iconAnchor: isNarrowViewport ? [7, 7] : [8, 8],
                  })}
                />
              )}
              {filteredTrucks.map((truck) => (
                <TruckMapMarker key={truck.id} truck={truck} onSelect={selectTruck} />
              ))}
            </MarkerClusterGroup>
          </MapContainer>

          <p className="pointer-events-none hidden sm:block absolute bottom-2 left-2 z-[450] max-w-[14rem] text-[9px] leading-snug text-slate-600/90 dark:text-slate-400">
            ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-slate-400/60 pointer-events-auto"
            >
              OpenStreetMap
            </a>
          </p>

          <button 
            onClick={handleFindNearest}
            disabled={isLocating}
            className="absolute top-[72px] sm:top-24 left-3 sm:left-4 z-[400] w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-black/5 flex items-center justify-center text-slate-900  hover:bg-white transition-all active:scale-95 disabled:opacity-70"
            title="Mening joylashuvim"
          >
            {isLocating ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[#007AFF]" /> : <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#007AFF]" />}
          </button>

          {/* Floating Action Cards */}
          <AnimatePresence>
            {selectedTruck && (
              <motion.div 
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute bottom-3 sm:bottom-6 left-0 right-0 mx-auto w-[92%] max-w-sm z-[1000] glass-card rounded-[20px] sm:rounded-[24px] p-3 sm:p-5 shadow-2xl border border-white/50 pointer-events-auto"
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-black/5 bg-slate-100">
                    <img 
                      src={selectedTruck.photoUrl} 
                      alt={selectedTruck.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      decoding="async"
                      fetchPriority="high"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden pt-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-[16px] sm:text-[17px] text-slate-900  truncate tracking-tight pr-2">{selectedTruck.name}</h3>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => toggleFavorite(selectedTruck.id)} 
                          className="text-slate-900   font-medium hover:text-[#FF3B30] bg-black/5 rounded-full p-1.5 transition-colors"
                        >
                          <Heart className={cn("w-4 h-4 transition-colors", favorites.includes(selectedTruck.id) ? "fill-[#FF3B30] text-[#FF3B30]" : "")} />
                        </button>
                        <button type="button" onClick={clearSelectedTruck} className="text-slate-900   font-medium hover:text-slate-900  bg-black/5 rounded-full p-1.5 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-900   font-medium mb-1.5 sm:mb-2 truncate mt-0.5 sm:mt-1 font-medium">{selectedTruck.address}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-slate-900  text-[16px] sm:text-lg tracking-tight">{formatCurrency(selectedTruck.pricePerDay)}</span>
                      <span className="text-slate-900   font-medium text-[10px] sm:text-xs">/ kun</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                       <span className={cn(
                         "text-[9px] sm:text-[10px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-medium tracking-wide uppercase shadow-sm border",
                         selectedTruck.status === 'available' ? "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20" : selectedTruck.status === 'finishing_soon' ? "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20" : "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20"
                       )}>
                         {selectedTruck.status === 'available' ? "Bo'sh" : selectedTruck.status === 'finishing_soon' ? "Tugamoqda" : "Band"}
                       </span>
                       <div className="flex items-center gap-0.5 sm:gap-1">
                          <Star className="w-[10px] h-[10px] sm:w-3 sm:h-3 text-[#FFD60A] fill-[#FFD60A]" />
                          <span className="text-[11px] sm:text-[12px] font-medium text-slate-900 ">{selectedTruck.rating}</span>
                          <span className="text-[9px] sm:text-[10px] text-slate-900   font-medium">({selectedTruck.reviewCount})</span>
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                  <button 
                    onClick={() => handleBooking(selectedTruck)}
                    className="glass-btn bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/90 text-slate-900  rounded-[14px] sm:rounded-xl py-2 sm:py-3.5 text-[13px] sm:text-sm font-medium active:scale-95 transition-all text-center"
                  >
                    Bron qilish
                  </button>
                  <button 
                    onClick={() => setIsDetailsModalOpen(true)}
                    className="bg-black/5 text-slate-900  rounded-[14px] sm:rounded-xl py-2 sm:py-3.5 text-[13px] sm:text-sm font-medium active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Batafsil
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar / Admin Panel (Drawer Style) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={closeSidebar}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000]"
              />
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={
                  isNarrowViewport
                    ? { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }
                    : { type: "spring", damping: 25, stiffness: 200 }
                }
                className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm glass z-[2001] shadow-2xl flex flex-col border-l border-white/40"
              >
                <div className="p-6 pt-10 border-b border-black/5 flex items-center justify-between">
                   <h2 className="font-medium text-xl tracking-tight text-slate-900 ">{isAdminViewOpen ? "Admin Panel" : "Profil"}</h2>
                   <button onClick={closeSidebar} className="bg-black/5 rounded-full p-1.5 transition-colors hover:bg-black/10">
                     <X className="w-5 h-5 text-slate-900 " />
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                  {profile ? (
                    isAdminViewOpen ? (
                      <div className="space-y-6">
                         <button 
                           onClick={() => setIsAdminViewOpen(false)}
                           className="text-sm font-medium text-slate-900  inline-block drop-shadow-md hover:text-[#cc7700] flex items-center gap-1 active:scale-95 transition-transform"
                         >
                           ← Profilga qaytish
                         </button>
                         <h3 className="text-slate-900  text-lg tracking-tight mb-4">Boshqaruv Paneli</h3>
                         <AdminDashboard bookings={allBookings} trucks={trucks} />
                      </div>
                    ) : (
                      <div className="space-y-8">
                         <div className="flex items-center gap-4">
                            <div className="w-[72px] h-[72px] rounded-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 flex items-center justify-center text-slate-900  inline-block drop-shadow-md overflow-hidden shadow-inner border border-[#0f172a]/20">
                               {user?.photoURL ? (
                                 <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                               ) : (
                                 <UserIcon className="w-8 h-8" />
                               )}
                            </div>
                          <div>
                             <p className="font-medium text-[20px] tracking-tight">{profile.name}</p>
                             <p className="text-[13px] text-slate-900   font-medium">{profile.email}</p>
                             <span className="text-[10px] px-2.5 py-0.5 bg-black/5 border border-black/5 rounded-full mt-2 inline-block uppercase font-medium text-slate-900   font-medium tracking-wider">
                               {profile.role}
                             </span>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h3 className="font-medium text-slate-900   font-medium text-xs uppercase tracking-widest flex items-center justify-between">
                            Mening Bronlarim
                            <div className="flex items-center gap-2">
                              <span className="bg-black/5 text-slate-900   font-medium px-2 py-0.5 rounded-full text-[10px]">{userBookings.length}</span>
                              <button 
                                onClick={() => { setIsSidebarOpen(false); setIsMyBookingsOpen(true); }}
                                className="text-slate-900  inline-block drop-shadow-md hover:underline text-xs capitalize normal-case font-medium"
                              >
                                Barchasini ko'rish
                              </button>
                            </div>
                          </h3>
                          {userBookings.length > 0 ? (
                            <div className="space-y-4">
                              {userBookings.slice(0, 2).map(booking => {
                                const t = trucks.find(tr => tr.id === booking.truckId);
                                return (
                                  <div key={booking.id} className="glass-card rounded-[24px] p-5 shadow-lg border border-white  flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="font-medium text-sm text-slate-900 ">{t?.name || 'Kutilmoqda...'}</p>
                                      <span className={cn(
                                        "text-[10px] px-2.5 py-1 rounded-full font-medium uppercase shadow-sm",
                                        booking.status === 'pending' ? "bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 text-slate-900  inline-block drop-shadow-md" :
                                        booking.status === 'confirmed' ? "bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 text-[#0f172a]" :
                                        booking.status === 'completed' ? "bg-[#34C759]/10 text-[#34C759]" :
                                        "bg-[#FF3B30]/10 text-[#FF3B30]"
                                      )}>
                                        {booking.status === 'pending' ? "Kutilmoqda" : booking.status}
                                      </span>
                                    </div>
                                    <p className="text-[13px] text-slate-900   font-medium flex items-center gap-1.5 font-medium">
                                      <Calendar className="w-4 h-4 opacity-70" />
                                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center">
                                      <span className="text-xs font-medium text-slate-900   font-medium">Jami narx</span>
                                      <span className="font-medium text-slate-900  inline-block drop-shadow-md tracking-tight">{formatCurrency(booking.totalPrice)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-white/40 rounded-[20px] p-6 flex flex-col items-center justify-center border border-white/60 py-12 text-slate-900   font-medium text-sm">
                               <Truck className="w-10 h-10 mb-3 opacity-30" />
                               Hozircha bronlar yo'q
                            </div>
                          )}
                       </div>

                       {profile.role === 'admin' && (
                         <div className="space-y-4">
                           <h3 className="font-medium text-slate-900   font-medium text-xs uppercase tracking-widest flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div>
                             Admin Panel
                           </h3>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/60 p-4 rounded-[16px] border border-white shadow-sm">
                                 <p className="text-[10px] text-slate-900   font-medium uppercase tracking-wider">Trucklar</p>
                                 <p className="text-[22px] font-medium text-slate-900  mt-1">{trucks.length.toLocaleString()}</p>
                              </div>
                              <div className="bg-white/60 p-4 rounded-[16px] border border-white shadow-sm">
                                 <p className="text-[10px] text-slate-900   font-medium uppercase tracking-wider">Bronlar</p>
                                 <p className="text-[22px] font-medium text-slate-900  mt-1">{allBookings.length}</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => setIsAdminViewOpen(true)}
                             className="w-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm  py-3.5 rounded-xl text-sm font-medium shadow-md shadow-[#0f172a]/20 active:scale-95 transition-all text-center"
                           >
                              Bronlarni boshqarish
                           </button>
                         </div>
                       )}

                       <div className="space-y-3">
                          <h3 className="font-medium text-slate-900   font-medium text-xs uppercase tracking-widest">Mening Ma'lumotlarim</h3>
                          <div className="glass-card rounded-[24px] overflow-hidden shadow-lg border border-white ">
                            <button 
                              onClick={() => { setIsFavoritesOpen(true); setIsSidebarOpen(false); }}
                              className="w-full flex items-center justify-between p-4 hover:bg-black/5  transition-colors border-b border-black/5 "
                            >
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-[#FF3B30]/10 flex items-center justify-center">
                                   <Heart className="w-4 h-4 text-[#FF3B30]" />
                                 </div>
                                 <span className="font-medium text-[15px] tracking-tight">Saqlanganlar</span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full text-slate-900   font-medium">{favorites.length}</span>
                                 <ChevronRight className="w-4 h-4 text-slate-900 " />
                               </div>
                            </button>
                            <button 
                              onClick={() => { setIsSupportOpen(true); setIsSidebarOpen(false); }}
                              className="w-full flex items-center justify-between p-4 hover:bg-black/5  transition-colors border-b border-black/5 "
                            >
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 flex items-center justify-center">
                                   <Info className="w-4 h-4 text-[#0f172a]" />
                                 </div>
                                 <span className="font-medium text-[15px] tracking-tight">Yordam Markazi</span>
                               </div>
                               <ChevronRight className="w-4 h-4 text-slate-900 " />
                            </button>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText("https://baazgo.uz/invite/" + user.uid);
                                toast.success("Taklif havolasi nusxalandi!");
                              }}
                              className="w-full flex items-center justify-between p-4 hover:bg-black/5  transition-colors border-b border-black/5"
                            >
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                                   <Users className="w-4 h-4 text-[#34C759]" />
                                 </div>
                                 <span className="font-medium text-[15px] tracking-tight">Do'stlarni taklif qilish</span>
                               </div>
                               <ChevronRight className="w-4 h-4 text-slate-900 " />
                            </button>
                            <Link
                              to="/terms"
                              onClick={() => setIsSidebarOpen(false)}
                              className="w-full flex items-center justify-between p-4 hover:bg-black/5 transition-colors border-b border-black/5"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-[#0f172a]" />
                                </div>
                                <span className="font-medium text-[15px] tracking-tight">Foydalanish shartlari</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-900" />
                            </Link>
                            <Link
                              to="/privacy"
                              onClick={() => setIsSidebarOpen(false)}
                              className="w-full flex items-center justify-between p-4 hover:bg-black/5 transition-colors border-b border-black/5"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                  <Shield className="w-4 h-4 text-[#0f172a]" />
                                </div>
                                <span className="font-medium text-[15px] tracking-tight">Maxfiylik siyosati</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-900" />
                            </Link>
                            <Link
                              to="/owner"
                              onClick={() => setIsSidebarOpen(false)}
                              className="w-full flex items-center justify-between p-4 hover:bg-black/5 transition-colors border-b border-black/5"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                  <Building2 className="w-4 h-4 text-[#0f172a]" />
                                </div>
                                <span className="font-medium text-[15px] tracking-tight">Furgon egasi</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-900" />
                            </Link>
                            <Link
                              to="/platform"
                              onClick={() => setIsSidebarOpen(false)}
                              className="w-full flex items-center justify-between p-4 hover:bg-black/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                  <ListTree className="w-4 h-4 text-[#0f172a]" />
                                </div>
                                <span className="font-medium text-[15px] tracking-tight">Platforma rejasi</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-900" />
                            </Link>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <h3 className="font-medium text-slate-900   font-medium text-xs uppercase tracking-widest">Sozlamalar</h3>
                          <div className="glass-card rounded-[24px] overflow-hidden shadow-lg border border-white ">
                            <button 
                              onClick={() => { setIsProfileSettingsOpen(true); setIsSidebarOpen(false); }}
                              className="w-full flex items-center justify-between p-4 hover:bg-black/5  transition-colors border-b border-black/5 "
                            >
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-[#AF52DE]/10 flex items-center justify-center">
                                   <UserIcon className="w-4 h-4 text-[#AF52DE]" />
                                 </div>
                                 <span className="font-medium text-[15px] tracking-tight">Profil sozlamalari</span>
                               </div>
                               <ChevronRight className="w-4 h-4 text-slate-900 " />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 hover:bg-black/5  transition-colors border-b border-black/5 ">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 flex items-center justify-center">
                                   <CreditCard className="w-4 h-4 text-slate-900  inline-block drop-shadow-md" />
                                 </div>
                                 <span className="font-medium text-[15px] tracking-tight">To'lov usullari</span>
                               </div>
                               <ChevronRight className="w-4 h-4 text-slate-900 " />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 hover:bg-black/5  transition-colors">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 flex items-center justify-center">
                                   <Calendar className="w-4 h-4 text-[#0f172a]" />
                                 </div>
                                 <span className="font-medium text-[15px] tracking-tight">Tarix</span>
                               </div>
                               <ChevronRight className="w-4 h-4 text-slate-900 " />
                            </button>
                          </div>
                       </div>
                     </div>
                    )
                  ) : (
                     <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-[100px] h-[100px] bg-white rounded-3xl flex items-center justify-center mb-8 shadow-md border border-black/5">
                           <Truck className="w-12 h-12 text-slate-900  inline-block drop-shadow-md" />
                        </div>
                        <p className="font-medium text-2xl mb-3 text-slate-900  tracking-tight">Tizimga kiring</p>
                        <p className="text-slate-900   font-medium text-[15px] mb-10 leading-relaxed font-medium">Avtomobillar ijarasi va boshqarish uchun profilingizga kiring. Bron qilish uchun ro'yxatdan o'tish talab etiladi.</p>
                        <button 
                          onClick={handleLogin}
                          disabled={isAuthenticating}
                          className="bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm  w-full py-4 rounded-2xl font-medium text-[17px] shadow-lg shadow-[#0f172a]/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                           {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tizimga kirish'}
                        </button>
                     </div>
                  )}
                </div>

                {profile && (
                  <div className="p-6 border-t border-black/5 bg-white/20">
                     <button 
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-2 text-[#FF3B30] font-medium text-[15px] py-4 rounded-2xl hover:bg-[#FF3B30]/10 transition-colors"
                     >
                       <LogOut className="w-4 h-4" />
                       Chiqish
                     </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Details Modal */}
        <AnimatePresence>
          {isDetailsModalOpen && selectedTruck && (
             <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-md"
                  onClick={() => setIsDetailsModalOpen(false)}
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="glass-card rounded-[24px] sm:rounded-[32px] w-full max-w-md z-[3001] shadow-2xl overflow-hidden border border-white max-h-[90dvh] flex flex-col"
                >
                  <div className="relative h-56 sm:h-72 shrink-0 group">
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={activePhotoIdx}
                        src={activePhotoIdx === 0 ? selectedTruck.photoUrl : selectedTruck.gallery[activePhotoIdx - 1]} 
                        alt={selectedTruck.name} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </AnimatePresence>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                    
                    {/* Gallery Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {[selectedTruck.photoUrl, ...selectedTruck.gallery].map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setActivePhotoIdx(i)}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300", 
                            activePhotoIdx === i ? "w-6 bg-white" : "w-1.5 bg-white/40"
                          )}
                        />
                      ))}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2">
                       <button 
                        onClick={() => toggleFavorite(selectedTruck.id)}
                        className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-slate-900  rounded-full p-2.5 transition-colors border border-white/20"
                      >
                        <Heart className={cn("w-5 h-5", favorites.includes(selectedTruck.id) ? "fill-[#FF3B30] text-[#FF3B30]" : "")} />
                      </button>
                      <button 
                        onClick={() => setIsDetailsModalOpen(false)}
                        className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-slate-900  rounded-full p-2.5 transition-colors border border-white/20"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="absolute bottom-12 left-6 right-6">
                       <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 bg-[#FFD60A] text-slate-900  px-2 py-0.5 rounded-lg font-medium text-xs">
                             <Star className="w-3 h-3 fill-black" />
                             {selectedTruck.rating}
                          </div>
                          <span className="text-slate-900   font-medium text-xs font-medium">{selectedTruck.reviewCount} та шарҳ</span>
                       </div>
                       <div className="flex items-center gap-2 mb-1">
                         <h2 className="text-2xl font-medium text-slate-900  tracking-tight leading-tight">{selectedTruck.name}</h2>
                         {selectedTruck.isVerified && (
                           <BadgeCheck className="w-5 h-5 text-[#34C759] fill-white" />
                         )}
                       </div>
                       <div className="flex items-center justify-between">
                         <p className="text-slate-900   font-medium text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> {selectedTruck.address}</p>
                         <button 
                           onClick={() => window.open(`https://maps.google.com/?q=${selectedTruck.latitude},${selectedTruck.longitude}`, '_blank')}
                           className="bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm  text-[10px] font-medium px-3 py-1.5 rounded-full shadow-lg shadow-[#0f172a]/30 uppercase tracking-widest active:scale-95 transition-transform"
                         >
                           Yo'nalish
                         </button>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-[#F2F2F7]/50 scroll-smooth">
                    <div className="p-6 space-y-6">
                      <div>
                        <h3 className="font-medium text-slate-900  text-lg mb-2">Tavsif</h3>
                        <p className="text-[15px] leading-relaxed text-slate-900 ">{selectedTruck.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-white/80 rounded-2xl p-4 border border-white shadow-sm">
                            <Truck className="w-5 h-5 text-slate-900  inline-block drop-shadow-md mb-2" />
                            <p className="text-[10px] text-slate-900   font-medium uppercase tracking-wider">O'lcham</p>
                            <p className="font-medium text-slate-900  text-sm">{selectedTruck.specs.dimensions}</p>
                         </div>
                         <div className="bg-white/80 rounded-2xl p-4 border border-white shadow-sm">
                            <Info className="w-5 h-5 text-[#0f172a] mb-2" />
                            <p className="text-[10px] text-slate-900   font-medium uppercase tracking-wider">Energiya</p>
                            <p className="font-medium text-slate-900  text-sm truncate">{selectedTruck.specs.powerSource}</p>
                         </div>
                      </div>

                      <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-5 border border-white shadow-sm">
                        <h3 className="font-medium text-slate-900  text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm"></div>
                           Ichki jihozlar
                        </h3>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                           {selectedTruck.specs.equipment.map((eq, i) => (
                             <div key={i} className="flex items-center gap-2 text-sm text-slate-900 ">
                                <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                                {eq}
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* Review Section */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <h3 className="font-medium text-slate-900  text-lg tracking-tight">Sharhlar</h3>
                            <button className="text-[#0f172a] font-medium text-sm active:opacity-60 transition-opacity">Barchasi ({selectedTruck.reviewCount})</button>
                         </div>
                         <div className="space-y-3">
                            {selectedTruck.reviews.slice(0, 2).map((rev) => (
                              <div key={rev.id} className="bg-white/60 p-4 rounded-2xl border border-white/40">
                                 <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                       <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 flex items-center justify-center font-medium text-[#0f172a] text-xs">
                                          {rev.userName[0]}
                                       </div>
                                       <div>
                                          <p className="text-xs font-medium text-slate-900 ">{rev.userName}</p>
                                          <div className="flex gap-0.5 mt-0.5">
                                             {Array.from({ length: 5 }).map((_, i) => (
                                               <Star key={i} className={cn("w-2 h-2", i < rev.rating ? "fill-[#FFD60A] text-[#FFD60A]" : "text-slate-900")} />
                                             ))}
                                          </div>
                                       </div>
                                    </div>
                                    <span className="text-[10px] text-slate-900   font-medium">Bugun</span>
                                 </div>
                                 <p className="text-[13px] text-slate-900  leading-relaxed font-medium">{rev.comment}</p>
                              </div>
                            ))}
                         </div>
                         <button className="w-full bg-white border border-slate-200 py-3 rounded-xl text-sm font-medium text-slate-900  active:scale-[0.98] transition-all">
                            Sharh qoldirish
                         </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 pt-4 mt-auto border-t border-black/5 bg-white/80 backdrop-blur-xl shrink-0 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                       <span className="text-[11px] font-medium text-slate-900   font-medium uppercase tracking-widest">Jami narx</span>
                       <span className="font-medium text-slate-900  text-2xl tracking-tighter">{formatCurrency(selectedTruck.pricePerDay)}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleBooking(selectedTruck);
                      }}
                      className="flex-1 glass-btn bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/90 border border-white/40 text-slate-900  py-4 rounded-[20px] font-medium text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                      Bron qilish
                    </button>
                  </div>
                </motion.div>
             </div>
          )}
        </AnimatePresence>

        {/* Auth Modal */}
        <AnimatePresence>
          {isAuthModalOpen && (
             <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-md"
                  onClick={() => setIsAuthModalOpen(false)}
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="glass-card rounded-[32px] w-full max-w-sm z-[4001] shadow-2xl overflow-hidden border border-white bg-white"
                >
                  <div className="p-6 pt-8">
                     <h2 className="text-2xl font-medium text-slate-900  text-center mb-6">
                       {authMode === 'login' ? 'Tizimga kirish' : "Ro'yxatdan o'tish"}
                     </h2>
                     {loginError && (
                       <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center">
                         {loginError}
                       </div>
                     )}
                     <form onSubmit={handleAuthSubmit} className="space-y-4">
                       {authMode === 'register' && (
                         <div>
                           <label className="block text-sm text-slate-900  mb-1">Ism va Familiya</label>
                           <input 
                             type="text"
                             required
                             value={authName}
                             onChange={e => setAuthName(e.target.value)}
                             className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/20 rounded-xl px-4 py-3 placeholder-slate-400 text-slate-900  transition-all outline-none"
                             placeholder="Eshmat Toshmatov"
                           />
                         </div>
                       )}
                       <div>
                         <label className="block text-sm text-slate-900  mb-1">Telefon raqam</label>
                         <input 
                           type="tel"
                           required
                           value={authPhone}
                           onChange={e => setAuthPhone(e.target.value)}
                           className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/20 rounded-xl px-4 py-3 placeholder-slate-400 text-slate-900  transition-all outline-none"
                           placeholder="+998 90 123 45 67"
                           dir="ltr"
                         />
                       </div>
                       <div>
                         <label className="block text-sm text-slate-900  mb-1">Parol</label>
                         <input 
                           type="password"
                           required
                           value={authPassword}
                           onChange={e => setAuthPassword(e.target.value)}
                           className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/20 rounded-xl px-4 py-3 placeholder-slate-400 text-slate-900  transition-all outline-none"
                           placeholder="••••••••"
                         />
                       </div>
                       
                       <button 
                         type="submit"
                         disabled={isAuthenticating}
                         className="w-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm py-4 rounded-[16px] font-medium text-[17px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#0f172a]/20 disabled:opacity-70"
                       >
                         {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish")}
                       </button>
                     </form>
                     
                     <div className="mt-6 text-center">
                       <button 
                         type="button"
                         onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                         className="text-sm font-medium text-[#0f172a] hover:underline"
                       >
                         {authMode === 'login' ? "Akkauntingiz yo'qmi? Ro'yxatdan o'ting" : "Akkauntingiz bormi? Kirish"}
                       </button>
                     </div>
                  </div>
                </motion.div>
             </div>
          )}
        </AnimatePresence>

        {/* Booking Modal */}
        <AnimatePresence>
          {isBookingModalOpen && selectedTruck && (
             <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-md"
                  onClick={() => setIsBookingModalOpen(false)}
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="glass-card rounded-[32px] w-full max-w-sm z-[3001] shadow-2xl overflow-hidden border border-white"
                >
                  <div className="p-6 pt-8 text-center flex flex-col items-center">
                     <div className="w-16 h-16 bg-gradient-to-br from-[#0f172a] to-[#FF3B30] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0f172a]/30 mb-4 border border-white/20 text-slate-900 ">
                        <Truck className="w-8 h-8 drop-shadow-md" />
                     </div>
                     <h2 className="font-medium text-2xl text-slate-900  tracking-tight leading-tight">Truck Bron qilish</h2>
                     <p className="text-[13px] text-slate-900   font-medium mt-1">Ijara tafsilotlarini tasdiqlang</p>
                  </div>
                  
                  <div className="px-6 space-y-4">
                     <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white space-y-3">
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-900   font-medium">Model</span>
                          <span className="text-slate-900 ">{selectedTruck.name}</span>
                       </div>
                       <div className="w-full h-px bg-black/5"></div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-900   font-medium">Kunlik narx</span>
                          <span className="text-slate-900 ">{formatCurrency(selectedTruck.pricePerDay)}</span>
                       </div>
                       <div className="w-full h-px bg-black/5"></div>
                       
                       <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-900   font-medium">Boshlanish</span>
                            <input 
                              type="date" 
                              min={new Date().toISOString().split('T')[0]}
                              value={bookingStartDate} 
                              onChange={(e) => {
                                setBookingStartDate(e.target.value);
                                if (new Date(e.target.value) > new Date(bookingEndDate)) {
                                  setBookingEndDate(e.target.value);
                                }
                              }} 
                              className="text-xs text-slate-900  bg-white border border-black/10 rounded-md p-1 outline-none"
                            />
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-900   font-medium">Tugash</span>
                            <input 
                              type="date" 
                              min={bookingStartDate}
                              value={bookingEndDate} 
                              onChange={(e) => setBookingEndDate(e.target.value)} 
                              className="text-xs text-slate-900  bg-white border border-black/10 rounded-md p-1 outline-none"
                            />
                         </div>
                       </div>
                       <div className="w-full h-px bg-black/5"></div>
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-900   font-medium">Promo-kod</span>
                          <div className="flex gap-1">
                            <input 
                              type="text" 
                              placeholder="Kodni kiriting"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              className="w-24 text-xs text-slate-900  bg-white border border-black/10 rounded-md p-1 outline-none uppercase placeholder:normal-case placeholder:font-normal"
                            />
                            <button 
                              onClick={() => {
                                if (promoCode === 'BAAZGO20') {
                                  setDiscountPercent(20);
                                  toast.success("20% Chegirma qo'llanildi!");
                                } else {
                                  toast.error("Noto'g'ri promo-kod");
                                  setDiscountPercent(0);
                                }
                              }}
                              className="text-xs bg-black text-slate-900  px-2 py-1 rounded-md font-medium"
                            >
                              Qo'llash
                            </button>
                          </div>
                       </div>
                     </div>
                     
                     <div className="flex justify-between items-center px-2 pt-2">
                        <span className="font-medium text-slate-900   font-medium text-sm">Jami to'lov:</span>
                        <div className="text-right">
                          {(() => {
                            const start = new Date(bookingStartDate);
                            const end = new Date(bookingEndDate);
                            const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                            let base = selectedTruck.pricePerDay * days;
                            if (days >= 14) base = base * 0.9;
                            const final = base * (1 - discountPercent / 100);
                            return (
                              <>
                                {discountPercent > 0 || days >= 14 ? (
                                  <span className="text-xs text-slate-900   font-medium line-through block">{formatCurrency(selectedTruck.pricePerDay * days)}</span>
                                ) : null}
                                <span className="font-medium text-slate-900  text-2xl tracking-tight leading-none">{formatCurrency(final)}</span>
                                <span className="block text-[10px] text-slate-900   font-medium mt-0.5">{days} kun {days >= 14 && '(Uzoq muddat chegirmasi 10%)'}</span>
                              </>
                            );
                          })()}
                        </div>
                     </div>
                     
                     <div className="bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 rounded-[16px] p-4 flex gap-3 border border-[#0f172a]/10">
                        <Info className="w-5 h-5 text-[#0f172a] shrink-0" />
                        <p className="text-[12px] text-[#0f172a] leading-relaxed font-medium">
                           To'lov usulini tanlash orqali bronni darhol tasdiqlang yoki joyida to'lashni tanlang. 
                        </p>
                     </div>
                  </div>

                  <div className="p-6 pt-4 pb-8 flex flex-col gap-3">
                     <div className="grid grid-cols-2 gap-3 mb-2">
                        <button 
                           onClick={confirmBooking}
                           disabled={isBooking}
                           className="w-full bg-[#00A199]/10 text-[#00A199] border border-transparent hover:border-[#00A199]/30 py-3 rounded-[16px] font-medium text-[15px] flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]"
                        >
                           Payme orqali
                        </button>
                        <button 
                           onClick={confirmBooking}
                           disabled={isBooking}
                           className="w-full bg-[#0082FB]/10 text-[#0082FB] border border-transparent hover:border-[#0082FB]/30 py-3 rounded-[16px] font-medium text-[15px] flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]"
                        >
                           Click orqali
                        </button>
                     </div>
                     <button 
                        onClick={confirmBooking}
                        disabled={isBooking}
                        className="w-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm  py-4 rounded-[16px] font-medium text-[15px] shadow-sm shadow-[#0f172a]/10 flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98]"
                     >
                        Tasdiqlash va joyida to'lash
                     </button>
                     <button 
                        onClick={() => setIsBookingModalOpen(false)}
                        className="w-full bg-white/50 text-[#FF3B30] py-3 mt-1 rounded-[16px] font-medium text-[15px] active:scale-[0.98] transition-all border border-black/5"
                     >
                        Bekor qilish
                     </button>
                  </div>
                </motion.div>
             </div>
          )}
        </AnimatePresence>

        {/* My Bookings Page */}
        <AnimatePresence>
          {isMyBookingsOpen && (
            <MyBookingsPage 
              isOpen={isMyBookingsOpen} 
              onClose={() => setIsMyBookingsOpen(false)} 
              bookings={userBookings} 
              trucks={trucks} 
            />
          )}
        </AnimatePresence>


      </main>

      {/* Navigation for Mobile */}
      <nav className="absolute bottom-0 left-0 right-0 w-full glass rounded-t-[24px] flex flex-col sm:hidden z-[1200] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-white pb-[env(safe-area-inset-bottom)] pointer-events-auto">
        <p className="px-2 pt-1.5 pb-0.5 text-center text-[8px] text-slate-400 leading-tight">
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-slate-300/80"
          >
            © OpenStreetMap
          </a>
        </p>
        <div className="flex w-full p-1 pb-3">
        <button type="button" className="flex-1 flex flex-col items-center justify-center pt-3 pb-2 text-[#007AFF] inline-block drop-shadow-md hover:bg-white/50 transition-colors rounded-2xl">
          <MapIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Asosiy</span>
        </button>
        <button type="button" className="flex-1 flex flex-col items-center justify-center pt-3 pb-2 text-slate-500 font-medium hover:text-slate-900 hover:bg-white/50 transition-colors rounded-2xl" onClick={() => setIsSidebarOpen(true)}>
          <Calendar className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Ijara</span>
        </button>
        <button type="button" className="flex-1 flex flex-col items-center justify-center pt-3 pb-2 text-slate-500 font-medium hover:text-slate-900 hover:bg-white/50 transition-colors rounded-2xl" onClick={() => setIsSidebarOpen(true)}>
          <UserIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
        </div>
      </nav>

        {/* Mobile Search & Filters Overlay */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[5000] bg-[#F2F2F7] sm:bg-black/50 sm:backdrop-blur-sm flex flex-col sm:justify-center sm:items-center sm:p-4"
            >
              <div className="glass-card flex flex-col w-full h-full sm:h-auto sm:max-w-md sm:rounded-[32px] overflow-hidden flex-1 sm:flex-initial shadow-xl border border-white ">
                 <div className="glass px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3 shadow-sm z-10 flex items-center gap-3 border-b border-black/5">
                    <div className="flex-1 relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900   font-medium" />
                       <input 
                         type="text" 
                         placeholder="Nomi yoki manzil..." 
                         className="w-full bg-black/5 border-none rounded-xl py-3 pl-10 pr-4 text-[15px] focus:bg-black/5 focus:ring-1 focus:ring-[#0f172a] transition-all outline-none text-slate-900 "
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         autoFocus
                       />
                    </div>
                    <button onClick={() => setIsMobileSearchOpen(false)} className="text-[#0f172a] font-medium text-[15px] active:scale-95 transition-transform p-2 sm:hidden">
                      Bekor
                    </button>
                    <button onClick={() => setIsMobileSearchOpen(false)} className="hidden sm:block text-slate-900   font-medium hover:text-slate-900  transition-colors p-2">
                       <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col">
                    <div className="p-4 overflow-x-auto flex gap-3 no-scrollbar border-b border-black/5 bg-white shrink-0">
                       <div className="min-w-[280px] bg-gradient-to-r from-[#FF007A] to-[#FF4D4D] rounded-2xl p-4 text-slate-900  flex flex-col justify-center shadow-lg shadow-[#FF4D4D]/20">
                         <span className="bg-white/20 text-slate-900  text-[10px] font-medium px-2 py-1 rounded-md w-fit mb-2 uppercase tracking-wider backdrop-blur-md">YANGI</span>
                         <h4 className="font-medium text-lg leading-tight mb-1">Bahor Chegirmasi 20%</h4>
                         <p className="text-slate-900   font-medium text-[11px] font-medium">Barcha furgonlar uchun. Promo: XAZRAT20</p>
                       </div>
                       <div className="min-w-[280px] bg-gradient-to-r from-[#00A199] to-[#00D2C8] rounded-2xl p-4 text-slate-900  flex flex-col justify-center shadow-lg shadow-[#00A199]/20">
                         <span className="bg-white/20 text-slate-900  text-[10px] font-medium px-2 py-1 rounded-md w-fit mb-2 uppercase tracking-wider backdrop-blur-md">BONUS</span>
                         <h4 className="font-medium text-lg leading-tight mb-1">Cashback 5% gacha</h4>
                         <p className="text-slate-900   font-medium text-[11px] font-medium">Har bir bron uchun pulingizni qaytaramiz.</p>
                       </div>
                    </div>

                    <div className="p-4 space-y-6 border-b border-black/5 bg-white shadow-sm shrink-0">
                    <div>
                      <h3 className="text-[13px] font-medium text-slate-900   font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                        Kategoriyalar
                      </h3>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-edges">
                        {[
                          { id: 'all', label: 'Barchasi', icon: '🍽️' },
                          { id: 'fastfood', label: 'Fast Food', icon: '🍔' },
                          { id: 'coffee', label: 'Kofe', icon: '☕' },
                          { id: 'bbq', label: 'Shashlik', icon: '🍖' },
                          { id: 'asian', label: 'Osiyo', icon: '🍜' },
                          { id: 'dessert', label: 'Shirinlik', icon: '🍦' }
                        ].map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border shrink-0",
                              activeCategory === cat.id 
                                ? "bg-white/60 backdrop-blur-xl border border-white/80 shadow-md text-slate-800" 
                                : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm"
                            )}
                          >
                            <span>{cat.icon}</span>
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-[13px] font-medium text-slate-900   font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Holati
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setFilterStatus('all')}
                          className={cn("flex-1 py-1 px-2 rounded-xl text-xs lg:text-sm font-medium border transition-all active:scale-[0.98]", filterStatus === 'all' ? "bg-white/60 backdrop-blur-xl border-white/80 text-slate-800 shadow-md" : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm")}
                        >
                          Barchasi
                        </button>
                        <button 
                          onClick={() => setFilterStatus('available')}
                          className={cn("flex-1 py-1 px-2 rounded-xl text-xs lg:text-sm font-medium border transition-all active:scale-[0.98]", filterStatus === 'available' ? "bg-green-500/20 backdrop-blur-md border-green-500/30 text-green-900 shadow-sm" : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm")}
                        >
                          Bo'sh
                        </button>
                        <button 
                          onClick={() => setFilterStatus('finishing_soon')}
                          className={cn("flex-1 py-1 px-2 rounded-xl text-xs lg:text-sm font-medium border transition-all active:scale-[0.98]", filterStatus === 'finishing_soon' ? "bg-orange-500/20 backdrop-blur-md border-orange-500/30 text-orange-900 shadow-sm" : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm")}
                        >
                          Tugamoqda
                        </button>
                        <button 
                          onClick={() => setFilterStatus('rented')}
                          className={cn("flex-1 py-1 px-2 rounded-xl text-xs lg:text-sm font-medium border transition-all active:scale-[0.98]", filterStatus === 'rented' ? "bg-red-500/20 backdrop-blur-md border-red-500/30 text-red-900 shadow-sm" : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm")}
                        >
                          Band
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-[13px] font-medium text-slate-900   font-medium uppercase tracking-wider flex items-center gap-2">
                           <CreditCard className="w-4 h-4" /> Maksimal Narx
                        </h3>
                        <span className="font-medium text-slate-900  inline-block drop-shadow-md text-[16px] bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 px-3 py-1 rounded-full">{formatCurrency(priceRange)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="500000" 
                        max="3000000" 
                        step="100000"
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-[#0f172a] bg-slate-200 h-2 rounded-full appearance-none mt-2"
                      />
                      <div className="flex justify-between text-[11px] text-slate-900   font-medium mt-2 px-1">
                         <span>500 Ming</span>
                         <span>3 Million</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-[13px] font-medium text-slate-900   font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Saralash
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setSortBy('default')}
                          className={cn("py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98]", sortBy === 'default' ? "bg-white/60 backdrop-blur-xl border-white/80 text-slate-800 shadow-md" : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm")}
                        >
                          Odatiy
                        </button>
                        <button 
                          onClick={() => handleFindNearest()}
                          className={cn("py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98]", sortBy === 'nearest' ? "bg-[#007AFF] text-white shadow-md border-[#007AFF]" : "bg-[#007AFF]/10 text-[#007AFF] border border-transparent shadow-sm")}
                        >
                          Eng yaqin
                        </button>
                        <button 
                          onClick={() => setSortBy('price_asc')}
                          className={cn("py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98]", sortBy === 'price_asc' ? "bg-white/60 backdrop-blur-xl border border-white/80 shadow-md text-slate-800" : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm")}
                        >
                          Arzonroq
                        </button>
                        <button 
                          onClick={() => setSortBy('price_desc')}
                          className={cn("py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98]", sortBy === 'price_desc' ? "bg-white/60 backdrop-blur-xl border border-white/80 shadow-md text-slate-800" : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm")}
                        >
                          Qimmatroq
                        </button>
                        <button 
                          onClick={() => setSortBy('rating_desc')}
                          className={cn("py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98]", sortBy === 'rating_desc' ? "bg-white/60 backdrop-blur-xl border border-white/80 shadow-md text-slate-800" : "bg-white/30 backdrop-blur-md border border-white/40 text-slate-800 hover:bg-white/50 shadow-sm")}
                        >
                          Reytingi baland
                        </button>
                     </div>
                    </div>

                    <div>
                      <h3 className="text-[13px] font-medium text-slate-900   font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4" /> Minimal Reyting
                      </h3>
                      <div className="flex gap-2">
                        {[0, 3, 4, 4.5].map(rating => (
                          <button 
                            key={rating}
                            onClick={() => setMinRating(rating)}
                            className={cn("flex-1 py-1.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98]", minRating === rating ? "bg-yellow-500 text-slate-900  border-yellow-500 shadow-md shadow-yellow-500/20" : "bg-white text-slate-900  border-slate-200")}
                          >
                            {rating === 0 ? 'Barchasi' : `${rating}+`}
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>

                 <div className="p-4 flex-1">
                   <h3 className="text-[13px] font-medium text-slate-900   font-medium uppercase tracking-wider mb-4 flex items-center justify-between">
                     Natijalar 
                     <span className="bg-black/5 text-slate-900   font-medium px-2.5 py-0.5 rounded-full text-[11px]">{filteredTrucks.length} ta</span>
                   </h3>
                   <div className="space-y-3 pb-8">
                     {filteredTrucks.slice(0, 30).map(truck => (
                       <button 
                         key={truck.id}
                         onClick={() => {
                           selectTruck(truck);
                           setIsMobileSearchOpen(false);
                         }}
                         className="w-full bg-white rounded-[20px] p-3 flex gap-4 shadow-sm border border-black/5 text-left active:scale-[0.98] transition-all hover:shadow-md group"
                       >
                         <img src={truck.photoUrl} alt={truck.name} className="w-24 h-24 rounded-[14px] object-cover bg-slate-100" referrerPolicy="no-referrer" />
                         <div className="flex-1 overflow-hidden flex flex-col justify-center">
                            <div className="flex justify-between items-start mb-1.5">
                              <h4 className="text-slate-900  text-[16px] truncate pr-2 tracking-tight group-hover:text-[#0f172a] transition-colors flex items-center gap-1.5">
                                {truck.name}
                                {truck.isVerified && <BadgeCheck className="w-4 h-4 text-[#34C759] flex-shrink-0" />}
                              </h4>
                              <span className={cn(
                                "text-[10px] px-2 py-1 rounded-md flex-shrink-0 font-medium uppercase tracking-wide",
                                truck.status === 'available' ? "bg-[#34C759]/10 text-[#34C759]" : truck.status === 'finishing_soon' ? "bg-[#FF9500]/10 text-[#FF9500]" : "bg-[#FF3B30]/10 text-[#FF3B30]"
                              )}>
                                {truck.status === 'available' ? "Bo'sh" : truck.status === 'finishing_soon' ? "Tugamoqda" : "Band"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-900   font-medium truncate mb-2.5 font-medium flex items-center">
                              <MapIcon className="w-3 h-3 mr-1 opacity-70" />{truck.address}
                            </p>
                            <p className="text-[15px] font-medium text-slate-900  tracking-tight">{formatCurrency(truck.pricePerDay)} <span className="text-[11px] font-medium text-slate-900   font-medium">/ kun</span></p>
                         </div>
                       </button>
                     ))}
                     {filteredTrucks.length > 30 && (
                       <div className="text-center pt-4 pb-8">
                          <p className="text-xs text-slate-900   font-medium bg-black/5 inline-block px-4 py-2 rounded-full">Va yana {filteredTrucks.length - 30} ta natija mavjud. Filtrni o'zgartiring.</p>
                       </div>
                     )}
                     {filteredTrucks.length === 0 && (
                       <div className="text-center py-16 opacity-60">
                         <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-3">
                           <Search className="w-8 h-8 text-slate-900   font-medium" />
                         </div>
                         <p className="text-sm font-medium text-slate-900   font-medium">Afsuski, hech qanday natija topilmadi.</p>
                       </div>
                     )}
                   </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {isFavoritesOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute inset-0 z-[6000] glass flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-black/5 ">
                <h2 className="text-xl font-medium tracking-tight text-slate-900   font-medium">Saqlanganlar</h2>
                <button onClick={() => setIsFavoritesOpen(false)} className="p-2 bg-black/5  rounded-full text-slate-900  ">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {favorites.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center opacity-60">
                    <Heart className="w-16 h-16 text-slate-900  mb-4" />
                    <p className="text-slate-900   font-medium">Hali hech narsa saqlamadingiz</p>
                  </div>
                ) : (
                  favorites.map(id => {
                    const truck = trucks.find(t => t.id === id);
                    if (!truck) return null;
                    return (
                       <button 
                         key={truck.id}
                         onClick={() => {
                           selectTruck(truck);
                           setIsFavoritesOpen(false);
                         }}
                         className="w-full bg-white  rounded-[20px] p-3 flex gap-4 shadow-sm border border-black/5  text-left active:scale-[0.98] transition-all hover:shadow-md group"
                       >
                         <img src={truck.photoUrl} alt={truck.name} className="w-24 h-24 rounded-[14px] object-cover bg-slate-100" referrerPolicy="no-referrer" />
                         <div className="flex-1 overflow-hidden flex flex-col justify-center">
                            <h4 className="text-slate-900   font-medium text-[16px] truncate pr-2 tracking-tight group-hover:text-[#0f172a] transition-colors flex items-center gap-1.5">
                              {truck.name}
                              {truck.isVerified && <BadgeCheck className="w-4 h-4 text-[#34C759] flex-shrink-0" />}
                            </h4>
                            <p className="text-xs text-slate-900   font-medium truncate mb-2.5 font-medium flex items-center">
                              <MapIcon className="w-3 h-3 mr-1 opacity-70" />{truck.address}
                            </p>
                            <p className="text-[15px] font-medium text-slate-900   font-medium tracking-tight">{formatCurrency(truck.pricePerDay)} <span className="text-[11px] font-medium text-slate-900   font-medium">/ kun</span></p>
                         </div>
                       </button>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}

          {isProfileSettingsOpen && (
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 50 }}
               className="absolute inset-0 z-[6000] glass flex flex-col"
             >
               <div className="flex items-center justify-between p-4 border-b border-black/5 ">
                 <h2 className="text-xl font-medium tracking-tight text-slate-900   font-medium">Profil sozlamalari</h2>
                 <button onClick={() => setIsProfileSettingsOpen(false)} className="p-2 bg-black/5  rounded-full text-slate-900  ">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-lg mx-auto w-full">
                 <div className="flex flex-col items-center">
                   <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden mb-4 relative group cursor-pointer">
                     {user?.photoURL ? (
                       <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#0f172a] to-[#FFCC00]">
                         <UserIcon className="w-10 h-10 text-slate-900 " />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera className="w-8 h-8 text-slate-900 " />
                     </div>
                   </div>
                   <h3 className="font-medium text-xl text-slate-900   font-medium">{profile?.name}</h3>
                   <p className="text-slate-900   font-medium">{profile?.email}</p>
                 </div>

                 <div className="bg-gradient-to-br from-[#0f172a] to-[#FFCC00] rounded-2xl p-5 text-slate-900  shadow-lg shadow-[#0f172a]/20 flex items-center justify-between">
                   <div>
                     <p className="text-slate-900   font-medium text-sm mb-1">Mavjud Cashback</p>
                     <h4 className="text-3xl font-medium tracking-tight">{formatCurrency(profile?.cashbackBalance || 0)}</h4>
                   </div>
                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                     <CreditCard className="w-6 h-6 text-slate-900 " />
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="text-xs font-medium text-slate-900   font-medium mb-1 block">Ismingiz</label>
                     <input type="text" defaultValue={profile?.name} className="w-full bg-black/5  border border-transparent focus:border-[#0f172a] rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors " />
                   </div>
                   <div>
                     <label className="text-xs font-medium text-slate-900   font-medium mb-1 block">Telefon raqamingiz</label>
                     <input type="text" defaultValue={profile?.phone || profile?.email.split('@')[0]} className="w-full bg-black/5  border border-transparent focus:border-[#0f172a] rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors " />
                   </div>
                 </div>

                 <button 
                   onClick={() => {
                     toast.success("Ma'lumotlar saqlandi");
                     setIsProfileSettingsOpen(false);
                   }}
                   className="w-full bg-[#34C759] text-slate-900  py-4 rounded-xl font-medium tracking-wide active:scale-95 transition-transform"
                 >
                   Saqlash
                 </button>
               </div>
             </motion.div>
          )}

          {isSupportOpen && (
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 50 }}
               className="absolute inset-0 z-[6000] glass flex flex-col"
             >
               <div className="flex items-center justify-between p-4 border-b border-black/5 ">
                 <h2 className="text-xl font-medium tracking-tight text-slate-900   font-medium">Yordam Markazi</h2>
                 <button onClick={() => setIsSupportOpen(false)} className="p-2 bg-black/5  rounded-full text-slate-900  ">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-lg mx-auto w-full">
                 <div className="text-center py-6 bg-black/5  rounded-2xl">
                    <Info className="w-12 h-12 text-slate-900  inline-block drop-shadow-md mx-auto mb-3" />
                    <h3 className="font-medium text-lg ">Sizga qanday yordam bera olamiz?</h3>
                    <p className="text-sm text-slate-900   font-medium mt-1 px-4">Bizning jamoamiz 24/7 aloqada, savollaringizni yozib qoldiring.</p>
                 </div>
                 
                 <div className="space-y-4">
                   <div className="p-4 glass-card rounded-[24px] overflow-hidden shadow-lg border border-white  flex items-center gap-4 cursor-pointer hover:bg-black/5  transition-colors">
                      <div className="w-12 h-12 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900   font-medium">Telegram orqali</h4>
                        <p className="text-[13px] text-slate-900   font-medium">@BaazGo_Supportbot</p>
                      </div>
                   </div>
                   <div className="p-4 glass-card rounded-[24px] overflow-hidden shadow-lg border border-white  flex items-center gap-4 cursor-pointer hover:bg-black/5  transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-lg border border-white/50 text-slate-900 shadow-sm/10 text-[#0f172a] flex items-center justify-center">
                        <Menu className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900   font-medium">Ko'p beriladigan savollar</h4>
                        <p className="text-[13px] text-slate-900   font-medium">Javoblarni tez toping</p>
                      </div>
                   </div>
                 </div>
               </div>
             </motion.div>
          )}

        </AnimatePresence>
    </div>
  );
}

