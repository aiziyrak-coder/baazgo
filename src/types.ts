export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface FoodTruck {
  id: string;
  name: string;
  description: string;
  category?: 'fastfood' | 'coffee' | 'bbq' | 'asian' | 'dessert' | 'other';
  isVerified?: boolean;
  photoUrl: string;
  gallery: string[];
  pricePerDay: number;
  latitude: number;
  longitude: number;
  address: string;
  status: 'available' | 'rented' | 'maintenance' | 'finishing_soon';
  ownerId: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  specs: {
    dimensions: string;
    powerSource: string;
    equipment: string[];
  };
  createdAt: string;
}

export interface Booking {
  id: string;
  truckId: string;
  userId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'unpaid' | 'paid';
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  cashbackBalance?: number;
  role: 'user' | 'admin' | 'owner';
  createdAt: string;
}

export interface SiteNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
