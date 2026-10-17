// Admin paneli API müqavilə tipləri (B.1: @ts-nocheck əvəzinə real tiplər).

export type ApiFn = <T = unknown>(path: string, opts?: RequestInit) => Promise<T>;
export type ToastFn = (msg: string, kind?: 'error' | 'success') => void;
export interface ToastState { msg: string; kind?: string }

export interface Me { id: number; ad: string; soyad: string; email: string; isAdmin: boolean }

export interface AdminUser {
  id: number; ad?: string; soyad?: string; email?: string; telefon?: string;
  cins?: string; isAdmin?: boolean; orderCount?: number; cartCount?: number; favCount?: number; createdAt?: string;
}

export interface CategoryNode { name: string; children?: string[] }
export interface Category {
  name: string; count?: number; subcategories?: string[]; tree?: CategoryNode[]; _new?: boolean;
}

export interface Product {
  id?: number; name: string; store?: string; storeId?: number | null;
  price: number | null; oldPrice?: number | null; discount?: number | null;
  rating?: number; reviews?: number; size?: string;
  category: string; subcategory?: string; subSubcategory?: string; gender?: string;
  sizeSystem?: string; fitType?: string; stretch?: string; color?: string;
  sizes?: string[]; sizeStock: Record<string, number>; material?: string;
  imageUrls: string[]; images?: number; stock?: number; description?: string;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected'; rejectReason?: string;
}

export interface Store {
  id?: number; name: string; rating?: number; reviews?: number; products?: number;
  city?: string; established?: number | null; address?: string; logo?: string;
  lat?: number | null; lng?: number | null; ownerEmail?: string;
}

export interface Payout {
  id: number; storeId: number; periodStart: string; periodEnd: string; amount: number;
  status: string; paidAt?: string | null; method: string; reference: string; note: string; createdAt: string;
}

export interface Dispute {
  id: number; orderId: number; orderNo: string; userId: number; userName: string;
  storeId?: number | null; storeName: string; reason: string; status: string;
  resolution: string; resolvedAt?: string | null; createdAt: string;
}

export interface ActivityItem {
  id: number; actorName: string; action: string; entityType: string; entityId: string; detail: string; createdAt: string;
}

export interface Coupon {
  id?: number; code: string; type: string; value: number | string;
  minOrder?: number | string; active?: boolean; expiresAt?: string | null; maxUses?: number | string | null; used?: number;
}

export interface OrderItem {
  name?: string; productId?: number; store?: string; selectedSize?: string; size?: string; qty?: number; price?: number;
}
export interface OrderStore { name: string; lat?: number | null; lng?: number | null }
export interface AdminOrder {
  id: number; orderNo: string; userName?: string; userEmail?: string;
  total: number; deliveryFee?: number; deliveryType?: string; km?: number | null;
  discount?: number; couponCode?: string; status: string; createdAt: string;
  items?: OrderItem[]; deliveryAddress?: { sehir?: string; unvan?: string } | null;
  payment?: { method?: string } | null; stores?: OrderStore[];
  customerLat?: number | null; customerLng?: number | null;
  cancelReason?: string; cancelledBy?: string;
}

export interface Stats {
  counts: { users: number; products: number; orders: number; stores: number; categories: number; reviews: number; admins: number };
  revenue: number;
  clothingSales: number; platformRevenue: number; commission: number; deliveryRevenue: number;
  recentOrders: { id: number; orderNo: string; total: number; status: string }[];
  ordersByStatus: Record<string, number>;
  lowStock: { id: number; name: string; store: string; stock: number }[];
  recentReviews?: { id: number; rating: number; productName: string; userName: string; comment?: string; createdAt: string }[];
}

export interface AdminStoreDetail {
  id: number; name: string; city: string; ownerEmail: string;
  salesUnits: number; orderCount: number; gmv: number; commission: number; netOwed: number;
  totalPaid: number; balance: number; payouts: Payout[];
}

export interface Analytics {
  totalRevenue: number; totalUnits: number; avgOrder: number;
  revenueByDay: { day: string; revenue: number; orders: number }[];
  topProducts: { id: number; name: string; units: number; revenue: number }[];
  byCategory: { category: string; revenue: number }[];
}

export interface AdminReview {
  id: number; productId?: number; userName?: string; rating: number; comment?: string; createdAt: string;
}

export interface LatLng { lat: number; lng: number }
