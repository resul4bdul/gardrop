// Müştəri (gardrop) tərəfi API müqavilə tipləri (B.1: @ts-nocheck əvəzinə real tiplər).
// Backend public DTO-larının frontend formasıdır (wire = AZ açarlar).

import type { Measurements, SizeChartRow } from './sizing';
export type { Measurements, SizeChartRow, SizeResult } from './sizing';

export type NavData = {
  product?: Product;
  category?: string;
  store?: Store | string | null;
  query?: string;
  tab?: string;
};
export type NavFn = (pg: string, data?: NavData) => void;

export interface Address {
  id: number;
  unvan: string;
  lat?: number | null;
  lng?: number | null;
  sehir?: string;
}

export interface User {
  id: number;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  cins?: string;
  isAdmin?: boolean;
  hasPassword?: boolean;
  addresses?: Address[];
  favorites?: number[];
  measurements?: Measurements;
}

export interface Category {
  name: string;
  count?: number;
  subcategories?: string[];
  tree?: { name: string; children?: string[] }[];
}

// CMS: /api/content → açar (home_hero | category_images | legal_docs) → JSON mətni
export type SiteContentMap = Record<string, string>;
export interface HeroSlide {
  image?: string;       // /uploads/.. şəkil (boş → placeholder)
  badge?: string;
  title?: string;       // sətirlər \n ilə ayrılır
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;     // nav səhifə açarı: catalog | stores | register | profile
  ctaCategory?: string; // ctaLink=catalog olduqda kateqoriya
}

export interface Product {
  id: number;
  name: string;
  store?: string;
  storeLogo?: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating?: number;
  reviews?: number;
  category: string;
  subcategory?: string;
  subSubcategory?: string;
  gender?: string;
  color?: string;
  material?: string;
  description?: string;
  size?: string;
  sizes?: string[];
  sizeStock?: Record<string, number>;
  imageUrls?: string[];
  images?: number;
  sizeSystem?: string;
  sizeChart?: SizeChartRow[];
  brand?: string;
  fitType?: string;
  stretch?: string;
  sizeBehavior?: string;
  washShrink?: boolean;
}

export interface CartItem {
  id: number;
  productId?: number;
  name: string;
  store?: string;
  price: number;
  qty?: number;
  selectedSize?: string;
  size?: string;
  color?: string;
  rating?: number;
  reviews?: number;
  imageUrls?: string[];
}

export interface Store {
  id: number;
  name: string;
  rating?: number;
  reviews?: number;
  products?: number;
  city?: string;
  logo?: string;
  established?: number | null;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  // Public profil (StoreView) — mağaza səhifəsi üçün
  banner?: string;
  url?: string;
  about?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  prepDays?: number | null;
  returnDays?: number | null;
}

export interface Review {
  id: number;
  userName: string;
  rating: number;
  comment?: string;
  imageUrls?: string[];
  storeReply?: string;
  createdAt?: string;
}

export interface OrderItem {
  id?: number;
  name?: string;
  store?: string;
  price?: number;
  qty?: number;
  selectedSize?: string;
  size?: string;
  imageUrls?: string[];
}

export interface Order {
  id: number;
  orderNo: string;
  status: string;
  total: number;
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  deliveryType?: string;
  deliveryFee?: number;
  discount?: number;
  couponCode?: string;
  cancelReason?: string;
  cancelledBy?: string;
  items?: OrderItem[];
  deliveryAddress?: { ad?: string; soyad?: string; telefon?: string; sehir?: string; unvan?: string } | null;
  payment?: { method?: string; last4?: string } | null;
}

export interface DeliveryInfo {
  fee?: number;
  free?: boolean;
  hasCoords?: boolean;
  multiStore?: boolean;
  km?: number | null;
  standardFee?: number;
  expressFee?: number;
  perStore?: unknown[];
}

export interface ToastItem {
  id: number;
  msg: string;
  type?: string;
  leaving?: boolean;
}

export interface Prefs {
  bildiris: boolean;
  tovsiye: boolean;
  [k: string]: boolean;
}

export interface CouponMsg { ok: boolean; text: string }

export interface RegisterForm { ad: string; soyad: string; email: string; telefon: string; password: string }

// Auth axını nəticəsi (App handler-ləri qaytarır, auth səhifələri oxuyur)
export interface AuthResult {
  ok?: boolean;
  error?: string;
  otp?: boolean;
  verify?: boolean;
  email?: string;
  message?: string;
  needsPassword?: boolean;
}

export type LatLng = { lat: number; lng: number };

// Səhifələrə App-dən {...cp} ilə ötürülən ortaq prop dəsti
export interface CommonProps {
  nav: NavFn;
  favs: number[];
  togFav: (id: number) => void;
  clearFavs?: () => void;
  addCart: (product: Product, size?: string) => void;
  removeFromCart: (id: number) => void;
  cart: CartItem[];
  user: User | null;
  products: Product[];
  stores: Store[];
  categories: Category[];
  catalogLoading: boolean;
  prefs: Prefs;
  content: SiteContentMap;
  showAuthPopup?: () => void;
}

// Brauzer global-ları (Google Identity Services + Leaflet + fly animasiya)
declare global {
  // eslint-disable-next-line no-var
  var L: any;
  interface Window {
    google?: any;
    L?: any;
    __gInited?: boolean;
    __flyPt?: { x: number; y: number };
  }
}
