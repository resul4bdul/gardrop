// In-memory mock database and services matching the original C# backend seed data
import type { Product, Store, Category } from "@/components/store/types";

export interface UserItem {
  id: number;
  firstName: string;
  lastName: string;
  ad?: string;
  soyad?: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  emailVerified: boolean;
  hasPassword: boolean;
  password?: string;
  createdAt: string;
}

export interface MockOrderItem {
  id: number;
  orderNo: string;
  userId?: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  status: "Hazırlanır" | "Hazırlandı" | "Yolda" | "Çatdırıldı" | "İptal";
  deliveryAddress: { unvan: string; sehir?: string; lat?: number; lng?: number };
  items: {
    productId: number;
    name: string;
    store: string;
    storeId?: number;
    selectedSize: string;
    size?: string;
    qty: number;
    price: number;
  }[];
  stores: { name: string; lat?: number; lng?: number }[];
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  payment: { method: string };
  cancelReason?: string;
  cancelledBy?: string;
  createdAt: string;
}

export interface MockReview {
  id: number;
  productId: number;
  productName: string;
  storeId?: number;
  userName: string;
  rating: number;
  comment: string;
  imageUrls?: string[];
  storeReply?: string;
  createdAt: string;
}

export interface StoreSettingsItem {
  bankName: string;
  iban: string;
  beneficiary: string;
  voen: string;
  legalName: string;
  notifyNewOrder: boolean;
  notifyNewReview: boolean;
  notifyEmail: boolean;
}

const SEED_STORES: Store[] = [
  { id: 1, name: "BakuWear", rating: 4.8, ratingCount: 24, reviews: 24, products: 4, city: "Bakı", established: 2018, lat: 40.3777, lng: 49.8920, address: "28 May küç. 5, Bakı", storeUrl: "bakuwear", about: "Bakının ən keyfiyyətli gündəlik geyim mağazası", logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&auto=format&fit=crop&q=80" },
  { id: 2, name: "StyleAZ", rating: 4.6, ratingCount: 18, reviews: 18, products: 3, city: "Bakı", established: 2019, lat: 40.4093, lng: 49.8671, address: "Nizami küç. 12, Bakı", storeUrl: "styleaz", about: "Müasir dəb və klassik üslub", logo: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&auto=format&fit=crop&q=80" },
  { id: 3, name: "DenimHouse", rating: 4.9, ratingCount: 31, reviews: 31, products: 2, city: "Gəncə", established: 2020, lat: 40.6828, lng: 46.3606, address: "Atatürk pr. 40, Gəncə", storeUrl: "denimhouse", about: "Cins və idman geyimlərində lider", logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80" },
  { id: 4, name: "UrbanAZ", rating: 4.7, ratingCount: 14, reviews: 14, products: 2, city: "Bakı", established: 2017, lat: 40.3953, lng: 49.8822, address: "Fəvvarələr meydanı, Bakı", storeUrl: "urbanaz", about: "Şəhər gənclərinin seçimi", logo: "https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=100&auto=format&fit=crop&q=80" },
  { id: 5, name: "ElegantAZ", rating: 4.9, ratingCount: 42, reviews: 42, products: 4, city: "Bakı", established: 2016, lat: 40.3725, lng: 49.8350, address: "8 Noyabr pr. 25, Bakı", storeUrl: "elegantaz", about: "Rəsmi və zərif geyimlər", logo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&auto=format&fit=crop&q=80" },
  { id: 6, name: "FashionAZ", rating: 4.5, ratingCount: 11, reviews: 11, products: 2, city: "Sumqayıt", established: 2021, lat: 40.5897, lng: 49.6686, address: "Sülh küç. 3, Sumqayıt", storeUrl: "fashionaz", about: "Qadın və uşaq dəbi", logo: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&auto=format&fit=crop&q=80" },
  { id: 7, name: "SportAZ", rating: 4.8, ratingCount: 27, reviews: 27, products: 3, city: "Bakı", established: 2015, lat: 40.4015, lng: 49.9498, address: "Heydər Əliyev pr. 100, Bakı", storeUrl: "sportaz", about: "İdman ayaqqabıları və aktiv geyim", logo: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=100&auto=format&fit=crop&q=80" },
];

const SEED_CATEGORIES: Category[] = [
  {
    name: "Kişi",
    subcategories: ["T-shirt", "Köynək", "Polo", "Hoodie", "Sviter", "Pencək", "Şalvar", "Cins", "Şort"],
    tree: [
      { name: "T-shirt", children: ["Qısaqol", "Uzunqol", "Basic", "Çaplı"] },
      { name: "Köynək", children: ["Klassik", "Denim", "Flanel", "Kətan"] },
      { name: "Polo", children: ["Qısaqol", "Uzunqol"] },
      { name: "Hoodie", children: ["Zəncirli", "Kapüşonlu", "Oversize"] },
      { name: "Sviter", children: ["Boğazlı", "V-yaxa", "Kardiqan"] },
      { name: "Pencək", children: ["Blazer", "Bomber", "Gödəkçə", "Palto"] },
      { name: "Şalvar", children: ["Klassik", "Karqo", "İdman", "Çino"] },
      { name: "Cins", children: ["Slim", "Regular", "Skinny"] },
      { name: "Şort", children: ["İdman", "Cins", "Klassik"] },
    ],
  },
  {
    name: "Qadın",
    subcategories: ["Paltar", "Bluz", "Köynək", "Kofta", "Palto", "Ətək", "Şalvar", "Cins", "Şort"],
    tree: [
      { name: "Paltar", children: ["Gündəlik", "Axşam", "Yay", "Trikotaj"] },
      { name: "Bluz", children: ["Klassik", "İpək", "Kətan"] },
      { name: "Köynək", children: ["Klassik", "Oversize", "Denim"] },
      { name: "Kofta", children: ["Kardiqan", "Sviter", "Boğazlı"] },
      { name: "Palto", children: ["Yun", "Trençkot", "Ödlük"] },
      { name: "Ətək", children: ["Mini", "Midi", "Maksi"] },
      { name: "Şalvar", children: ["Klassik", "Palazzo", "İdman"] },
      { name: "Cins", children: ["Skinny", "Mom", "Geniş"] },
      { name: "Şort", children: ["Cins", "Klassik"] },
    ],
  },
  {
    name: "Uşaq",
    subcategories: ["Üst geyim", "Alt geyim", "Dəstlər", "Ayaqqabı"],
    tree: [
      { name: "Üst geyim", children: ["T-shirt", "Köynək", "Sviter", "Ödlük"] },
      { name: "Alt geyim", children: ["Şalvar", "Şort", "Ətək"] },
      { name: "Dəstlər", children: ["İdman dəsti", "Yay dəsti"] },
      { name: "Ayaqqabı", children: ["Krossovka", "Sandalet", "Çəkmə"] },
    ],
  },
  {
    name: "Ayaqqabı",
    subcategories: ["Krossovka", "Klassik", "Çəkmə", "Sandalet", "Dabanlı", "Babet"],
    tree: [
      { name: "Krossovka", children: ["İdman", "Gündəlik", "Running"] },
      { name: "Klassik", children: ["Oksford", "Loafer", "Derbi"] },
      { name: "Çəkmə", children: ["Qış", "Dəri", "Çelsi"] },
      { name: "Sandalet", children: ["Plyaj", "Klassik"] },
      { name: "Dabanlı", children: ["Stiletto", "Platforma"] },
      { name: "Babet", children: ["Klassik", "Üzlü"] },
    ],
  },
  {
    name: "Aksesuar",
    subcategories: ["Çanta", "Kəmər", "Papaq", "Eynək", "Şərf", "Saat", "Əlcək"],
    tree: [
      { name: "Çanta", children: ["Çiyin", "Backpack", "Bel", "Portfel"] },
      { name: "Kəmər", children: ["Dəri", "Toxuma"] },
      { name: "Papaq", children: ["Beysbol", "Şapka", "Beret"] },
      { name: "Eynək", children: ["Günəş", "Optik"] },
      { name: "Şərf", children: ["Yun", "İpək"] },
      { name: "Saat", children: ["Klassik", "Smart"] },
      { name: "Əlcək", children: ["Dəri", "Trikotaj"] },
    ],
  },
];

const RAW_PRODUCTS = [
  { id: 1, name: "Qara Sadə T-shirt", store: "BakuWear", storeId: 1, price: 44.99, oldPrice: undefined, size: "L", discount: undefined, category: "Kişi", subcategory: "T-shirt", subSubcategory: "Basic", gender: "Male", sizeSystem: "INT", color: "Qara", sizeStock: { S: 10, M: 15, L: 12, XL: 5 }, material: "100% Pambıq", description: "Qarderobun ən əvəzolunmaz elementlərindən biri olan klassik qara t-shirt. Yumşaq pambıq parça gündəlik rahatlıq təmin edir." },
  { id: 2, name: "Pambıq Köynək", store: "StyleAZ", storeId: 2, price: 84, oldPrice: 105, size: "XL", discount: 20, category: "Kişi", subcategory: "Köynək", subSubcategory: "Klassik", gender: "Male", sizeSystem: "INT", color: "Ağ", sizeStock: { M: 6, L: 8, XL: 4 }, material: "100% Pambıq", description: "Rəsmi və yarı-rəsmi tədbirlər üçün ideal ağ köynək. Nəfəs alan parça bütün gün təravət bəxş edir." },
  { id: 3, name: "Slim Fit Cins", store: "DenimHouse", storeId: 3, price: 65.99, oldPrice: undefined, size: "M", discount: undefined, category: "Kişi", subcategory: "Cins", subSubcategory: "Slim", gender: "Male", sizeSystem: "INT", fitType: "Slim", stretch: "low", color: "Mavi", sizeStock: { S: 8, M: 12, L: 10 }, material: "98% Pambıq, 2% Elastan", description: "Müasir slim fit kəsim. Elastik parça hərəkət azadlığı verir, gündəlik geyim üçün mükəmməldir." },
  { id: 4, name: "Polo Köynək", store: "BakuWear", storeId: 1, price: 55, oldPrice: 70, size: "L", discount: 21, category: "Kişi", subcategory: "Polo", subSubcategory: "Qısaqol", gender: "Male", sizeSystem: "INT", color: "Yaşıl", sizeStock: { M: 9, L: 7, XL: 9 }, material: "95% Pambıq, 5% Elastan", description: "Klassik polo dizaynı. İdman və gündəlik geyimlər arasında mükəmməl balans." },
  { id: 5, name: "Casual Hoodie", store: "UrbanAZ", storeId: 4, price: 89.99, oldPrice: undefined, size: "XL", discount: undefined, category: "Kişi", subcategory: "Hoodie", subSubcategory: "Oversize", gender: "Unisex", sizeSystem: "INT", fitType: "Oversize", stretch: "medium", color: "Boz", sizeStock: { S: 12, M: 18, L: 15, XL: 10 }, material: "80% Pambıq, 20% Polyester", description: "İsti və rahat hoodie. Soyuq günlər üçün ideal, yumşaq daxili tük astar ilə." },
  { id: 6, name: "Klassik Blazer", store: "ElegantAZ", storeId: 5, price: 145, oldPrice: 180, size: "L", discount: 19, category: "Kişi", subcategory: "Pencək", subSubcategory: "Blazer", gender: "Male", sizeSystem: "INT", color: "Tünd mavi", sizeStock: { M: 4, L: 5, XL: 3 }, material: "70% Yun, 30% Polyester", description: "Eleqant kəsimli blazer. Rəsmi tədbirlər və iş geyimi üçün vazkeçilməz." },
  { id: 7, name: "Çiçəkli Paltar", store: "FashionAZ", storeId: 6, price: 78.99, oldPrice: undefined, size: "S", discount: undefined, category: "Qadın", subcategory: "Paltar", subSubcategory: "Yay", gender: "Female", sizeSystem: "INT", color: "Çiçəkli", sizeStock: { XS: 6, S: 11, M: 10, L: 6 }, material: "100% Viskoza", description: "Yay üçün yüngül çiçəkli paltar. Zərif dizayn və rahat kəsim." },
  { id: 8, name: "Yüngül Cardigan", store: "StyleAZ", storeId: 2, price: 62, oldPrice: 80, size: "M", discount: 22, category: "Qadın", subcategory: "Kofta", subSubcategory: "Kardiqan", gender: "Female", sizeSystem: "INT", color: "Krem", sizeStock: { S: 9, M: 10, L: 8 }, material: "60% Pambıq, 40% Akril", description: "Yumşaq və yüngül kardiqan. Mövsümlərarası geyim üçün ideal seçim." },
  { id: 9, name: "Bej Trençkot", store: "ElegantAZ", storeId: 5, price: 199, oldPrice: 250, size: "S", discount: 20, category: "Qadın", subcategory: "Palto", subSubcategory: "Trençkot", gender: "Female", sizeSystem: "INT", color: "Bej", sizeStock: { XS: 3, S: 4, M: 2 }, material: "65% Pambıq, 35% Polyester", description: "Klassik bej trençkot. Payız üçün stil və funksionallığı birləşdirir." },
  { id: 10, name: "Uşaq Ödlük", store: "FashionAZ", storeId: 6, price: 35.99, oldPrice: undefined, size: "M", discount: undefined, category: "Uşaq", subcategory: "Üst geyim", subSubcategory: "Ödlük", gender: "Unisex", sizeSystem: "INT", color: "Sarı", sizeStock: { XS: 14, S: 16, M: 10 }, material: "100% Polyester", description: "Uşaqlar üçün isti və yüngül ödlük. Su keçirməyən səth, rahat hərəkət." },
  { id: 11, name: "Sport Krossovka", store: "SportAZ", storeId: 7, price: 115, oldPrice: 145, size: "42", discount: 20, category: "Ayaqqabı", subcategory: "Krossovka", subSubcategory: "İdman", gender: "Unisex", sizeSystem: "TR", color: "Ağ", sizeStock: { "40": 8, "41": 12, "42": 15, "43": 9, "44": 4 }, material: "Tekstil və sintetik", description: "Yüngül və nəfəs alan idman krossovkası. Gündəlik və idman üçün mükəmməl." },
  { id: 12, name: "Dəri Oksford", store: "ElegantAZ", storeId: 5, price: 185, oldPrice: undefined, size: "43", discount: undefined, category: "Ayaqqabı", subcategory: "Klassik", subSubcategory: "Oksford", gender: "Male", sizeSystem: "TR", color: "Qəhvəyi", sizeStock: { "41": 4, "42": 6, "43": 3, "44": 2 }, material: "100% Təbii dəri", description: "Əl işi təbii dəri oksford ayaqqabı. Rəsmi geyimlər üçün klassik seçim." },
  { id: 13, name: "Klassik Şalvar", store: "ElegantAZ", storeId: 5, price: 72, oldPrice: 90, size: "40", discount: 20, category: "Kişi", subcategory: "Şalvar", subSubcategory: "Klassik", gender: "Male", sizeSystem: "TR", fitType: "Regular", stretch: "low", color: "Antrasit", sizeStock: { "38": 6, "40": 9, "42": 7, "44": 4, "46": 2 }, material: "65% Pambıq, 33% Polyester, 2% Elastan", description: "Rəqəm ölçülü klassik kişi şalvarı. İş və rəsmi geyim üçün rahat regular kəsim." },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[əƏ]/g, "e")
    .replace(/[ıI]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[çÇ]/g, "c")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Generate seeded products
const SEED_PRODUCTS: Product[] = RAW_PRODUCTS.map((p: any): Product => {
  const sizes = Object.keys(p.sizeStock);
  const stock = Object.values(p.sizeStock).reduce((a: number, b: any) => a + Number(b), 0);
  const imageUrls = [
    `https://picsum.photos/seed/gd${p.id}a/600/800`,
    `https://picsum.photos/seed/gd${p.id}b/600/800`,
    `https://picsum.photos/seed/gd${p.id}c/600/800`,
    `https://picsum.photos/seed/gd${p.id}d/600/800`,
  ];
  return {
    ...p,
    sizeStock: p.sizeStock as Record<string, number>,
    slug: slugify(p.name),
    sizes,
    stock,
    imageUrls,
    images: imageUrls.length,
    rating: 4.8,
    reviews: 6,
    reviewCount: 6,
  };
});

const SEED_CONTENT: Record<string, string> = {
  hero_title: "Gardrop — Azərbaycanın Müasir Geyim Marketplace-i",
  hero_subtitle: "Seçilmiş yerli brendlər, sürətli çatdırılma və etibarlı xidmət",
  delivery_info: "Bakı daxili 24 saat ərzində, regionlara isə 2-3 iş günü ərzində təhlükəsiz çatdırılma.",
  returns_info: "14 gün ərzində asan və qaydasında məhsul dəyişdirilməsi və geri qaytarılması.",
};

const SEED_USER: UserItem = {
  id: 1,
  firstName: "Rasul",
  lastName: "Abdul",
  ad: "Rasul",
  soyad: "Abdul",
  email: "resul4bdul@gmail.com",
  phone: "+994 50 123 45 67",
  isAdmin: true,
  emailVerified: true,
  hasPassword: true,
  password: "123456",
  createdAt: new Date().toISOString(),
};

const SEED_ORDERS: MockOrderItem[] = [
  {
    id: 101,
    orderNo: "GD-829143",
    userId: 1,
    userName: "Rasul Abdul",
    userEmail: "resul4bdul@gmail.com",
    userPhone: "+994 50 123 45 67",
    status: "Çatdırıldı",
    deliveryAddress: { unvan: "28 May küç. 15, mənzil 42", sehir: "Bakı" },
    items: [
      { productId: 1, name: "Qara Sadə T-shirt", store: "BakuWear", storeId: 1, selectedSize: "L", qty: 2, price: 44.99 },
      { productId: 4, name: "Polo Köynək", store: "BakuWear", storeId: 1, selectedSize: "L", qty: 1, price: 55 },
    ],
    stores: [{ name: "BakuWear", lat: 40.3777, lng: 49.8920 }],
    subtotal: 144.98,
    deliveryFee: 4,
    discount: 10,
    couponCode: "XOSGELMISEN",
    total: 138.98,
    payment: { method: "Kartla onlayn" },
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 102,
    orderNo: "GD-741289",
    userId: 1,
    userName: "Aysel Qasımova",
    userEmail: "aysel.q@example.az",
    userPhone: "+994 55 987 65 43",
    status: "Yolda",
    deliveryAddress: { unvan: "Nizami küç. 45", sehir: "Bakı" },
    items: [
      { productId: 7, name: "Çiçəkli Paltar", store: "FashionAZ", storeId: 6, selectedSize: "S", qty: 1, price: 78.99 },
      { productId: 8, name: "Yüngül Cardigan", store: "StyleAZ", storeId: 2, selectedSize: "M", qty: 1, price: 62 },
    ],
    stores: [
      { name: "FashionAZ", lat: 40.5897, lng: 49.6686 },
      { name: "StyleAZ", lat: 40.4093, lng: 49.8671 },
    ],
    subtotal: 140.99,
    deliveryFee: 4,
    discount: 0,
    total: 144.99,
    payment: { method: "Qapıda nağd" },
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 103,
    orderNo: "GD-912834",
    userId: 1,
    userName: "Kamran Əliyev",
    userEmail: "kamran@example.az",
    userPhone: "+994 70 333 22 11",
    status: "Hazırlanır",
    deliveryAddress: { unvan: "Gənclik m/s yaxınlığı, bina 8", sehir: "Bakı" },
    items: [
      { productId: 11, name: "Sport Krossovka", store: "SportAZ", storeId: 7, selectedSize: "42", qty: 1, price: 115 },
    ],
    stores: [{ name: "SportAZ", lat: 40.4015, lng: 49.9498 }],
    subtotal: 115,
    deliveryFee: 4,
    discount: 17.25,
    couponCode: "YAY15",
    total: 101.75,
    payment: { method: "Kartla onlayn" },
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

const SEED_REVIEWS: MockReview[] = [
  { id: 1, productId: 1, productName: "Qara Sadə T-shirt", storeId: 1, userName: "Leyla M.", rating: 5, comment: "Parçası çox yumşaqdır və yuyulduqda rəngi getmir. Tövsiyə edirəm!", createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
  { id: 2, productId: 3, productName: "Slim Fit Cins", storeId: 3, userName: "Elvin T.", rating: 5, comment: "Kəsimi mükəmməldir, stretch olması əladır.", createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
  { id: 3, productId: 11, productName: "Sport Krossovka", storeId: 7, userName: "Murad S.", rating: 4, comment: "Rahat və yüngüldür, ölçüsü tam uyğun gəldi.", createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
];

const SEED_ACTIVITY: any[] = [
  { id: 1, actorName: "Rasul Abdul", action: "Sifariş yaratdı", entityType: "Order", entityId: "GD-912834", detail: "Sport Krossovka sifarişi", createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
  { id: 2, actorName: "Sistem", action: "Kupon tətbiq edildi", entityType: "Coupon", entityId: "YAY15", detail: "%15 endirim", createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
  { id: 3, actorName: "Admin", action: "Məhsul redaktə edildi", entityType: "Product", entityId: "1", detail: "Qara Sadə T-shirt stok yeniləndi", createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
];

// Global in-memory storage singleton
class InMemoryDb {
  public stores: Store[] = [...SEED_STORES];
  public categories: Category[] = [...SEED_CATEGORIES];
  public products: Product[] = [...SEED_PRODUCTS];
  public users: UserItem[] = [{ ...SEED_USER }];
  public content: Record<string, string> = { ...SEED_CONTENT };
  public cart: Array<{ id: number; productId: number; product: Product; size: string; quantity: number }> = [];
  public favorites: number[] = [1, 3, 5];
  public orders: MockOrderItem[] = [...SEED_ORDERS];
  public reviews: MockReview[] = [...SEED_REVIEWS];
  public activity: any[] = [...SEED_ACTIVITY];
  public coupons: any[] = [
    { code: "XOSGELMISEN", type: "amount", value: 10, minOrder: 100, active: true },
    { code: "YAY15", type: "percent", value: 15, minOrder: 50, active: true },
  ];
  public notifications: any[] = [
    { id: 1, title: "Xoş gəlmisiniz!", message: "Gardrop marketplace-ə xoş gəlmisiniz. Kupon: XOSGELMISEN", read: false, createdAt: new Date().toISOString() },
    { id: 2, title: "Sifariş statusu", message: "GD-741289 nömrəli sifarişiniz yola çıxdı.", read: false, createdAt: new Date().toISOString() },
  ];
  public addresses: any[] = [
    { id: 1, title: "Ev", address: "28 May küçəsi, bina 15, mənzil 42", city: "Bakı", phone: "+994 50 123 45 67", isDefault: true },
  ];
  public storeSettings: Record<number, StoreSettingsItem> = {
    1: { bankName: "Kapital Bank", iban: "AZ31NABZ01350100000000123456", beneficiary: "BakuWear MMC", voen: "1234567891", legalName: "BakuWear MMC", notifyNewOrder: true, notifyNewReview: true, notifyEmail: true },
    2: { bankName: "ABB", iban: "AZ45IBAZ38019440022345678901", beneficiary: "StyleAZ MMC", voen: "9876543211", legalName: "StyleAZ MMC", notifyNewOrder: true, notifyNewReview: true, notifyEmail: true },
    3: { bankName: "Paşa Bank", iban: "AZ12PASHA000123456789012345", beneficiary: "DenimHouse MMC", voen: "5544332211", legalName: "DenimHouse MMC", notifyNewOrder: true, notifyNewReview: true, notifyEmail: true },
  };

  public findProductBySlugOrId(slugOrId: string): Product | null {
    const s = decodeURIComponent(slugOrId).toLowerCase();
    return this.products.find((p) => (p.slug && p.slug.toLowerCase() === s) || String(p.id) === s) || null;
  }

  public findStoreBySlugOrId(slugOrId: string): Store | null {
    const s = decodeURIComponent(slugOrId).toLowerCase();
    return this.stores.find((st) => (st.storeUrl && st.storeUrl.toLowerCase() === s) || String(st.id) === s) || null;
  }

  public getStoreSettings(storeId: number): StoreSettingsItem {
    return this.storeSettings[storeId] || {
      bankName: "Kapital Bank",
      iban: "AZ31NABZ01350100000000123456",
      beneficiary: "Gardrop Satıcı",
      voen: "1000000001",
      legalName: "Satıcı MMC",
      notifyNewOrder: true,
      notifyNewReview: true,
      notifyEmail: true,
    };
  }
}

// Global instance attached to globalThis to persist during hot module reloads in Node
const globalDb = (globalThis as any).__GARDROP_DB__ || new InMemoryDb();
(globalThis as any).__GARDROP_DB__ = globalDb;

export const db = globalDb as InMemoryDb;
