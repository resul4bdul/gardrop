// Mağaza paneli API müqavilə tipləri (B.1: @ts-nocheck əvəzinə real tiplər).
// Backend store-owner DTO-larının frontend formasıdır (wire = AZ açarlar).

export type ApiFn = <T = unknown>(path: string, opts?: RequestInit) => Promise<T>;
export type ToastFn = (msg: string, kind?: 'error' | 'success') => void;
export interface ToastState { msg: string; kind?: string }

export interface Category {
  name: string;
  subcategories?: string[];
  tree?: { name: string; children?: string[] }[];
}

export interface SizeChartRow {
  size: string;
  boyMin: number | null;
  boyMax: number | null;
  cekiMin: number | null;
  cekiMax: number | null;
}

export interface ProductVariant {
  size: string;
  color: string;
  sku: string;
  stock: number;
}

export interface Product {
  id?: number;
  name: string;
  brand?: string;
  price: number | null;
  oldPrice?: number | null;
  buyPrice?: number | null;   // yalnız satıcı görür
  discount?: number | null;
  category: string;
  subcategory?: string;
  subSubcategory?: string;
  gender?: string;
  sizeSystem?: string;
  fitType?: string;
  stretch?: string;
  sizeBehavior?: string;
  washShrink?: boolean;
  sizeChart?: SizeChartRow[];
  sizeStock: Record<string, number>;
  variants?: ProductVariant[];
  colors?: string[];   // backend-də variantlardan törədilir (read-only)
  imageUrls: string[];
  images?: number;
  size?: string;
  sizes?: string[];
  stock?: number;
  color?: string;
  material?: string;
  season?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  isDraft?: boolean;
  views?: number;
  salesCount?: number;
  description?: string;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  rejectReason?: string;
}

export interface OrderItem { id?: number; name: string; selectedSize?: string; color?: string; qty: number; price: number }

export interface Order {
  id: number;
  orderNo: string;
  status: string;
  deliveryType?: string;
  paymentMethod?: string;
  createdAt: string;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string;
  cancelledBy?: string;
  userName?: string;
  userEmail?: string;
  myItems?: OrderItem[];
  myPrepared?: boolean;
  mySubtotal: number;
  multiStore?: boolean;
  storeCount?: number;
  preparedCount?: number;
  allReady?: boolean;
  deliveryAddress?: { sehir?: string; unvan?: string; telefon?: string; ad?: string } | null;
}

export interface Review {
  id: number;
  userName: string;
  rating: number;
  productName: string;
  createdAt: string;
  comment?: string;
  imageUrls?: string[];
  storeReply?: string;
}

export interface StoreNotification { id: number; type: string; title: string; body: string; createdAt: string; read?: boolean }

export interface Store {
  id: number;
  name: string;
  city?: string;
  established?: number | null;
  address?: string;
  logo?: string;
  lat?: number | null;
  lng?: number | null;
  rating?: number;
  reviews?: number;
  products?: number;
  // FAZA 6 — public profil/sosial/əlaqə/çatdırılma
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

// Həssas ayarlar (GET /api/store/{id}/settings — bank/hüquqi/bildiriş)
export interface StoreSettings {
  bankName: string;
  iban: string;
  beneficiary: string;
  voen: string;
  legalName: string;
  notifyNewOrder: boolean;
  notifyNewReview: boolean;
  notifyEmail: boolean;
}

export interface StoreKpis {
  todaySales: number; monthSales: number; totalSales: number; todayOrders: number;
  activeProducts: number; soldUnits: number; pendingOrders: number; avgOrder: number;
}
export interface RecentOrder { id: number; orderNo: string; customer: string; status: string; amount: number; createdAt: string }
export interface RecentReview { userName: string; rating: number; productName: string; createdAt: string; comment: string }
export interface Dashboard {
  counts: { products: number; orders: number };
  revenue: number;
  store: { rating?: number; reviews?: number };
  ordersByStatus?: Record<string, number>;
  lowStock?: { id: number; name: string; stock: number }[];
  kpis: StoreKpis;
  recentOrders: RecentOrder[];
  recentReviews: RecentReview[];
}

export interface Analytics {
  totalRevenue: number;
  totalUnits: number;
  orderCount: number;
  avgOrder: number;
  revenueByDay: { day: string; revenue: number; units: number; orders: number }[];
  revenueByMonth: { day: string; revenue: number; units: number; orders: number }[];
  topProducts: { id: number; name: string; units: number; revenue: number; image?: string }[];
  leastProducts: { id: number; name: string; units: number; revenue: number; image?: string }[];
}

export interface StoreFinancePoint { month: string; gross: number; commission: number; net: number }
export interface CommissionReportRow { category: string; percent: number; units: number; gross: number; commission: number; net: number }
export interface Payout {
  id: number; storeId: number; periodStart: string; periodEnd: string; amount: number;
  status: string; paidAt?: string | null; method: string; reference: string; note: string; createdAt: string;
}
export interface StoreFinance {
  currentBalance: number; monthEarnings: number; totalEarnings: number; platformCommission: number; pendingPayout: number;
  grossTotal: number; totalPaid: number; monthly: StoreFinancePoint[]; commissionReport: CommissionReportRow[]; payouts: Payout[];
}

export interface LatLng { lat: number; lng: number }
