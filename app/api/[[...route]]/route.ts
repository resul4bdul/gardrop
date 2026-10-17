import { NextResponse } from "next/server";
import { db, MockOrderItem } from "@/lib/mockDb";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ route?: string[] }> };

function getSegments(params: { route?: string[] }): string[] {
  return params.route || [];
}

function sanitize(val: any): any {
  if (typeof val === "string") {
    return val.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  if (Array.isArray(val)) {
    return val.map(sanitize);
  }
  if (val && typeof val === "object") {
    const res: any = {};
    for (const k of Object.keys(val)) {
      res[k] = sanitize(val[k]);
    }
    return res;
  }
  return val;
}

export async function GET(req: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const segs = getSegments(resolvedParams);
  const path = segs.join("/").toLowerCase();
  const url = new URL(req.url);

  // 1. Products
  if (path === "products") {
    const q = url.searchParams.get("q")?.toLowerCase();
    const cat = url.searchParams.get("category");
    let list = db.products;
    if (q) {
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q) ?? false));
    }
    if (cat && cat !== "Hamısı") {
      list = list.filter((p) => p.category === cat);
    }
    return NextResponse.json({ products: list, total: list.length });
  }

  if (segs[0] === "products" && segs[1]) {
    const p = db.findProductBySlugOrId(segs[1]);
    if (!p) return NextResponse.json({ error: "Məhsul tapılmadı" }, { status: 404 });
    return NextResponse.json(p);
  }

  // 2. Stores
  if (path === "stores") {
    return NextResponse.json(db.stores);
  }

  if (segs[0] === "stores" && segs[1]) {
    const s = db.findStoreBySlugOrId(segs[1]);
    if (!s) return NextResponse.json({ error: "Mağaza tapılmadı" }, { status: 404 });
    return NextResponse.json(s);
  }

  // 3. Categories
  if (path === "categories") {
    return NextResponse.json(db.categories);
  }

  // 4. Content
  if (path === "content" || path === "content/legal_docs") {
    return NextResponse.json(db.content);
  }

  // 5. Auth
  if (path === "auth/me") {
    const user = db.users[0];
    return NextResponse.json(user);
  }

  // 6. Cart & Favorites
  if (path === "cart") {
    return NextResponse.json(db.cart);
  }

  if (path === "favorites/ids") {
    return NextResponse.json(db.favorites);
  }
  if (path === "favorites") {
    const favProducts = db.products.filter((p) => db.favorites.includes(p.id));
    return NextResponse.json(favProducts);
  }

  // 7. Notifications
  if (path === "notifications") {
    return NextResponse.json(db.notifications);
  }

  // 8. Addresses
  if (path === "addresses") {
    return NextResponse.json(db.addresses);
  }

  // 9. Orders
  if (path === "orders") {
    return NextResponse.json(db.orders);
  }

  // 10. Reviews
  if (path === "reviews/eligible") {
    return NextResponse.json(db.products.slice(0, 3));
  }
  if (segs[0] === "reviews") {
    return NextResponse.json(db.reviews);
  }

  // 11. Payments & Delivery
  if (path === "payments/config") {
    return NextResponse.json({ stripeEnabled: false, codEnabled: true });
  }

  // 12. Problems
  if (path.startsWith("problems")) {
    return NextResponse.json([]);
  }

  // 13. Size recommendation
  if (path.startsWith("size-recommendation")) {
    return NextResponse.json({ recommendedSize: "M", confidence: 95 });
  }

  // 14. Store Merchant Panel (/api/store/...)
  if (segs[0] === "store") {
    if (path === "store/me" || path === "store") {
      return NextResponse.json({
        hasStore: true,
        stores: db.stores,
      });
    }

    const storeId = Number(segs[1]);
    const action = segs[2] || "";

    if (storeId) {
      const storeObj = db.stores.find((s) => s.id === storeId) || db.stores[0];

      if (action === "dashboard") {
        const storeProducts = db.products.filter((p) => p.storeId === storeId || p.store === storeObj.name);
        const storeOrders = db.orders.filter((o) => o.items.some((it) => it.store === storeObj.name || it.storeId === storeId));
        const storeReviews = db.reviews.filter((r) => r.storeId === storeId);
        const totalRev = storeOrders.reduce((sum, o) => sum + o.total, 0) || 540;

        return NextResponse.json({
          counts: { products: storeProducts.length, orders: storeOrders.length },
          revenue: totalRev,
          store: { rating: storeObj.rating || 4.8, reviews: storeObj.reviews || 24 },
          ordersByStatus: {
            "Hazırlanır": 1,
            "Hazırlandı": 1,
            "Yolda": 1,
            "Çatdırıldı": 2,
          },
          lowStock: storeProducts.filter((p) => (p.stock || 0) < 15).map((p) => ({ id: p.id, name: p.name, stock: p.stock || 10 })),
          kpis: {
            todaySales: 138.98,
            monthSales: totalRev,
            totalSales: totalRev * 3.5,
            todayOrders: 1,
            activeProducts: storeProducts.length,
            soldUnits: 18,
            pendingOrders: 1,
            avgOrder: 65,
          },
          recentOrders: storeOrders.map((o) => ({
            id: o.id,
            orderNo: o.orderNo,
            customer: o.userName,
            status: o.status,
            amount: o.total,
            createdAt: o.createdAt,
          })),
          recentReviews: storeReviews.map((r) => ({
            userName: r.userName,
            rating: r.rating,
            productName: r.productName,
            createdAt: r.createdAt,
            comment: r.comment,
          })),
        });
      }

      if (action === "analytics") {
        const storeOrders = db.orders.filter((o) => o.items.some((it) => it.store === storeObj.name || it.storeId === storeId));
        const totalRev = storeOrders.reduce((sum, o) => sum + o.total, 0) || 720;
        return NextResponse.json({
          totalRevenue: totalRev,
          totalUnits: 24,
          orderCount: storeOrders.length || 3,
          avgOrder: 68,
          revenueByDay: [
            { day: "2026-10-11", revenue: 84, units: 1, orders: 1 },
            { day: "2026-10-12", revenue: 145, units: 2, orders: 1 },
            { day: "2026-10-13", revenue: 0, units: 0, orders: 0 },
            { day: "2026-10-14", revenue: 199, units: 1, orders: 1 },
            { day: "2026-10-15", revenue: 138.98, units: 3, orders: 1 },
            { day: "2026-10-16", revenue: 65.99, units: 1, orders: 1 },
            { day: "2026-10-17", revenue: 115, units: 1, orders: 1 },
          ],
          revenueByMonth: [
            { day: "Avq", revenue: 1250, units: 20, orders: 14 },
            { day: "Sen", revenue: 1840, units: 28, orders: 21 },
            { day: "Okt", revenue: 747.97, units: 10, orders: 6 },
          ],
          topProducts: db.products.slice(0, 3).map((p) => ({
            id: p.id,
            name: p.name,
            units: 8,
            revenue: p.price * 8,
            image: p.imageUrls?.[0],
          })),
          leastProducts: db.products.slice(3, 5).map((p) => ({
            id: p.id,
            name: p.name,
            units: 1,
            revenue: p.price,
            image: p.imageUrls?.[0],
          })),
        });
      }

      if (action === "finance") {
        return NextResponse.json({
          currentBalance: 420.50,
          monthEarnings: 747.97,
          totalEarnings: 3820.00,
          platformCommission: 74.80,
          pendingPayout: 350.00,
          grossTotal: 4240.50,
          totalPaid: 3470.00,
          monthly: [
            { month: "2026-08", gross: 1250, commission: 125, net: 1125 },
            { month: "2026-09", gross: 1840, commission: 184, net: 1656 },
            { month: "2026-10", gross: 747.97, commission: 74.80, net: 673.17 },
          ],
          commissionReport: [
            { category: "Kişi", percent: 10, units: 6, gross: 420, commission: 42, net: 378 },
            { category: "Qadın", percent: 10, units: 3, gross: 210, commission: 21, net: 189 },
          ],
          payouts: [
            { id: 1, storeId, periodStart: "2026-09-01", periodEnd: "2026-09-30", amount: 1656, status: "Ödənilib", paidAt: "2026-10-01", method: "Bank köçürməsi", reference: "TX-99218", note: "Sentyabr ödənişi", createdAt: "2026-10-01" },
          ],
        });
      }

      if (action === "settings") {
        return NextResponse.json(db.getStoreSettings(storeId));
      }

      if (action === "products") {
        const storeProducts = db.products.filter((p) => p.storeId === storeId || p.store === storeObj.name);
        return NextResponse.json(storeProducts);
      }

      if (action === "orders") {
        const storeOrders = db.orders.filter((o) => o.items.some((it) => it.store === storeObj.name || it.storeId === storeId));
        return NextResponse.json(storeOrders);
      }

      if (action === "reviews") {
        const storeReviews = db.reviews.filter((r) => r.storeId === storeId);
        return NextResponse.json(storeReviews);
      }

      if (action === "problems") {
        return NextResponse.json([]);
      }
    }
  }

  // 15. Admin Panel (/api/admin/...)
  if (segs[0] === "admin") {
    const sub = segs[1] || "";

    if (sub === "stats") {
      const ordersByStatus: Record<string, number> = {
        "Hazırlanır": 0,
        "Hazırlandı": 0,
        "Yolda": 0,
        "Çatdırıldı": 0,
        "İptal": 0,
      };
      db.orders.forEach((o) => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });
      const totalRevenue = db.orders.reduce((sum, o) => sum + o.total, 0);

      return NextResponse.json({
        counts: {
          users: db.users.length + 38,
          products: db.products.length,
          orders: db.orders.length,
          stores: db.stores.length,
          categories: db.categories.length,
          reviews: db.reviews.length,
          admins: 1,
        },
        revenue: totalRevenue,
        clothingSales: totalRevenue * 0.9,
        platformRevenue: totalRevenue * 0.1,
        commission: totalRevenue * 0.1,
        deliveryRevenue: db.orders.length * 4,
        recentOrders: db.orders.slice(0, 5).map((o) => ({
          id: o.id,
          orderNo: o.orderNo,
          total: o.total,
          status: o.status,
        })),
        ordersByStatus,
        lowStock: db.products.filter((p) => (p.stock || 0) < 15).map((p) => ({
          id: p.id,
          name: p.name,
          store: p.store || "BakuWear",
          stock: p.stock || 10,
        })),
        recentReviews: db.reviews.slice(0, 5).map((r) => ({
          id: r.id,
          rating: r.rating,
          productName: r.productName,
          userName: r.userName,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
      });
    }

    if (sub === "analytics") {
      const totalRev = db.orders.reduce((sum, o) => sum + o.total, 0);
      return NextResponse.json({
        totalRevenue: totalRev,
        totalUnits: 38,
        avgOrder: 64,
        revenueByDay: [
          { day: "2026-10-11", revenue: 140, orders: 2 },
          { day: "2026-10-12", revenue: 220, orders: 3 },
          { day: "2026-10-13", revenue: 95, orders: 1 },
          { day: "2026-10-14", revenue: 310, orders: 4 },
          { day: "2026-10-15", revenue: 138.98, orders: 1 },
          { day: "2026-10-16", revenue: 144.99, orders: 1 },
          { day: "2026-10-17", revenue: 101.75, orders: 1 },
        ],
        topProducts: db.products.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          units: 12,
          revenue: p.price * 12,
        })),
        byCategory: db.categories.map((c) => ({
          category: c.name,
          revenue: 350 + Math.floor(Math.random() * 400),
        })),
      });
    }

    if (sub === "users") {
      const mapped = db.users.map((u) => ({
        id: u.id,
        ad: u.firstName || u.ad || "",
        soyad: u.lastName || u.soyad || "",
        email: u.email,
        telefon: u.phone,
        isAdmin: u.isAdmin,
        orderCount: db.orders.filter((o) => o.userEmail === u.email).length || 2,
        cartCount: db.cart.length,
        favCount: db.favorites.length,
        createdAt: u.createdAt,
      }));
      return NextResponse.json(mapped);
    }

    if (sub === "products") return NextResponse.json(db.products);
    if (sub === "stores") return NextResponse.json(db.stores);
    if (sub === "categories") return NextResponse.json(db.categories);
    if (sub === "orders") return NextResponse.json(db.orders);
    if (sub === "coupons") return NextResponse.json(db.coupons);
    if (sub === "reviews") return NextResponse.json(db.reviews);
    if (sub === "problems") return NextResponse.json([]);
    if (sub === "activity") return NextResponse.json(db.activity);
    if (sub === "content") return NextResponse.json(db.content);
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const segs = getSegments(resolvedParams);
  const path = segs.join("/").toLowerCase();

  let body: any = {};
  try {
    body = sanitize(await req.json());
  } catch {
    body = {};
  }

  // 1. Auth: Login
  if (path === "auth/login") {
    const user = db.users.find((u) => u.email.toLowerCase() === (body.email || "").toLowerCase()) || db.users[0];
    return NextResponse.json({
      token: "demo_jwt_token_secure_gardrop_12345",
      user,
    });
  }

  if (path === "auth/login-verify") {
    return NextResponse.json({
      token: "demo_jwt_token_secure_gardrop_12345",
      user: db.users[0],
    });
  }

  if (path === "auth/register") {
    const newUser = {
      id: db.users.length + 1,
      firstName: body.firstName || body.ad || "İstifadəçi",
      lastName: body.lastName || body.soyad || "",
      ad: body.firstName || body.ad || "İstifadəçi",
      soyad: body.lastName || body.soyad || "",
      email: body.email || "user@gardrop.az",
      phone: body.phone || "+994 50 000 00 00",
      isAdmin: false,
      emailVerified: true,
      hasPassword: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    return NextResponse.json({
      token: "demo_jwt_token_secure_gardrop_12345",
      user: newUser,
    });
  }

  if (path === "auth/verify-email" || path === "auth/resend-login" || path === "auth/resend-verification") {
    return NextResponse.json({ ok: true, token: "demo_jwt_token_secure_gardrop_12345", user: db.users[0] });
  }

  if (path === "auth/forgot") {
    return NextResponse.json({ ok: true, message: "Şifrə sıfırlama linki e-poçt ünvanınıza göndərildi." });
  }

  if (path === "auth/reset") {
    return NextResponse.json({ ok: true });
  }

  if (path === "auth/google") {
    return NextResponse.json({
      token: "demo_jwt_token_secure_gardrop_12345",
      user: db.users[0],
      needsPassword: false,
    });
  }

  // Profile endpoints
  if (path === "profile/password") {
    return NextResponse.json({ ok: true, message: "Şifrə uğurla dəyişdirildi" });
  }

  if (path === "profile/measurements") {
    return NextResponse.json({ ok: true, measurements: body });
  }

  // 2. Cart
  if (path === "cart") {
    const p = db.products.find((prod) => prod.id === body.productId) || db.products[0];
    const item = {
      id: Date.now(),
      productId: p.id,
      product: p,
      size: body.size || p.sizes?.[0] || "M",
      quantity: body.quantity || 1,
    };
    db.cart.push(item);
    return NextResponse.json(db.cart);
  }

  // 3. Favorites
  if (segs[0] === "favorites" && segs[1]) {
    const id = Number(segs[1]);
    if (id && !db.favorites.includes(id)) db.favorites.push(id);
    return NextResponse.json(db.favorites);
  }

  // 4. Coupon validation
  if (path === "coupons/validate") {
    const code = (body.code || "").toUpperCase();
    const coupon = db.coupons.find((c) => c.code === code && c.active);
    if (!coupon) return NextResponse.json({ valid: false, error: "Kupon kodu yanlışdır və ya müddəti bitib" }, { status: 400 });
    return NextResponse.json({ valid: true, ...coupon });
  }

  // 5. Delivery quote
  if (path === "delivery/quote") {
    return NextResponse.json({ cost: 4.0, time: "24 saat", freeThreshold: 50 });
  }

  // 6. Orders
  if (path === "orders") {
    const orderNo = "GD-" + Math.floor(100000 + Math.random() * 900000);
    const orderItems = (body.items && body.items.length) ? body.items : [...db.cart];
    const totalAmount = Number(body.totalAmount) || 120;
    const newOrder: MockOrderItem = {
      id: Date.now(),
      orderNo,
      userId: 1,
      userName: body.userName || "Rasul Abdul",
      userEmail: body.userEmail || "resul4bdul@gmail.com",
      userPhone: body.phone || "+994 50 123 45 67",
      status: "Hazırlanır",
      deliveryAddress: typeof body.address === "object" ? body.address : { unvan: body.address || "Bakı şəhəri" },
      items: orderItems.map((it: any) => ({
        productId: it.productId || 1,
        name: it.name || it.product?.name || "Geyim",
        store: it.store || it.product?.store || "BakuWear",
        selectedSize: it.selectedSize || it.size || "M",
        qty: it.qty || it.quantity || 1,
        price: it.price || it.product?.price || 45,
      })),
      stores: [{ name: "BakuWear", lat: 40.3777, lng: 49.8920 }],
      total: totalAmount,
      subtotal: totalAmount,
      deliveryFee: 4,
      discount: body.discount || 0,
      couponCode: body.couponCode,
      payment: { method: body.paymentMethod || "Kartla onlayn" },
      createdAt: new Date().toISOString(),
    };
    db.orders.unshift(newOrder);
    db.activity.unshift({
      id: Date.now(),
      actorName: newOrder.userName,
      action: "Sifariş yaratdı",
      entityType: "Order",
      entityId: newOrder.orderNo,
      detail: `${newOrder.total} ₼ məbləğində sifariş`,
      createdAt: new Date().toISOString(),
    });
    db.cart = [];
    return NextResponse.json({ ok: true, orderNo, order: newOrder });
  }

  // 7. Reviews
  if (path === "reviews") {
    const newRev = {
      id: db.reviews.length + 1,
      productId: Number(body.productId) || 1,
      productName: body.productName || "Məhsul",
      storeId: Number(body.storeId) || 1,
      userName: body.userName || "Müştəri",
      rating: Number(body.rating) || 5,
      comment: body.comment || "",
      imageUrls: body.imageUrls || [],
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(newRev);
    return NextResponse.json({ ok: true, review: newRev });
  }

  // 8. Addresses
  if (path === "addresses") {
    const addr = { id: Date.now(), ...body };
    db.addresses.push(addr);
    return NextResponse.json(addr);
  }

  // 9. Notifications
  if (path === "notifications/read") {
    db.notifications.forEach((n) => (n.read = true));
    return NextResponse.json({ ok: true });
  }

  // 10. Store Merchant endpoints
  if (segs[0] === "store") {
    const storeId = Number(segs[1]);
    const action = segs[2] || "";

    if (action === "products") {
      const storeObj = db.stores.find((s) => s.id === storeId) || db.stores[0];
      const newProd = {
        id: db.products.length + 1,
        name: body.name || "Yeni Məhsul",
        slug: (body.name ? body.name.toLowerCase().replace(/\s+/g, "-") : "yeni-mehsul") + "-" + Date.now(),
        store: storeObj.name,
        storeId,
        price: Number(body.price) || 50,
        oldPrice: body.oldPrice ? Number(body.oldPrice) : undefined,
        size: body.size || "M",
        discount: body.discount || undefined,
        category: body.category || "Kişi",
        subcategory: body.subcategory || "T-shirt",
        gender: body.gender || "Unisex",
        sizeSystem: body.sizeSystem || "INT",
        color: body.color || "Qara",
        sizeStock: body.sizeStock || { S: 5, M: 10, L: 8 },
        sizes: body.sizes || ["S", "M", "L"],
        stock: 23,
        material: body.material || "Pambıq",
        description: body.description || "",
        imageUrls: body.imageUrls || ["https://picsum.photos/seed/newprod/600/800"],
        images: 1,
        rating: 5.0,
        reviews: 0,
      };
      db.products.unshift(newProd as any);
      return NextResponse.json(newProd);
    }

    if (action === "orders" && segs[4] === "courier") {
      return NextResponse.json({ ok: true, message: "Kuryer çağırıldı" });
    }

    if (action === "problems" && segs[4] === "respond") {
      return NextResponse.json({ ok: true });
    }
  }

  // 11. Admin CRUD: Products, Stores, Categories, Coupons
  if (segs[0] === "admin") {
    const sub = segs[1] || "";
    if (sub === "products") {
      const newProd = {
        id: db.products.length + 1,
        name: body.name || "Yeni Məhsul",
        slug: (body.name ? body.name.toLowerCase().replace(/\s+/g, "-") : "yeni-mehsul") + "-" + Date.now(),
        store: body.store || "BakuWear",
        storeId: body.storeId || 1,
        price: Number(body.price) || 50,
        oldPrice: body.oldPrice ? Number(body.oldPrice) : undefined,
        size: body.size || "M",
        discount: body.discount || undefined,
        category: body.category || "Kişi",
        subcategory: body.subcategory || "T-shirt",
        gender: body.gender || "Unisex",
        sizeSystem: body.sizeSystem || "INT",
        color: body.color || "Qara",
        sizeStock: body.sizeStock || { S: 5, M: 10, L: 8 },
        sizes: body.sizes || ["S", "M", "L"],
        stock: 23,
        material: body.material || "Pambıq",
        description: body.description || "",
        imageUrls: body.imageUrls || ["https://picsum.photos/seed/newprod/600/800"],
        images: 1,
        rating: 5.0,
        reviews: 0,
      };
      db.products.unshift(newProd as any);
      return NextResponse.json(newProd);
    }

    if (sub === "stores") {
      const newStore = {
        id: db.stores.length + 1,
        name: body.name || "Yeni Mağaza",
        rating: 5.0,
        reviews: 0,
        products: 0,
        city: body.city || "Bakı",
        established: Number(body.established) || 2026,
        lat: Number(body.lat) || 40.4093,
        lng: Number(body.lng) || 49.8671,
        address: body.address || "Bakı",
        storeUrl: (body.name ? body.name.toLowerCase().replace(/\s+/g, "-") : "magaza") + "-" + Date.now(),
        logo: body.logo || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100",
      };
      db.stores.push(newStore);
      return NextResponse.json(newStore);
    }

    if (sub === "categories") {
      const newCat = {
        name: body.name,
        subcategories: body.subcategories || [],
        tree: body.tree || [],
      };
      db.categories.push(newCat);
      return NextResponse.json(newCat);
    }

    if (sub === "coupons") {
      const newC = {
        id: db.coupons.length + 1,
        code: (body.code || "").toUpperCase(),
        type: body.type || "percent",
        value: Number(body.value) || 10,
        minOrder: Number(body.minOrder) || 50,
        active: body.active !== false,
      };
      db.coupons.push(newC);
      return NextResponse.json(newC);
    }
  }

  // Upload
  if (path === "upload") {
    const url = `https://picsum.photos/seed/${Date.now()}/600/800`;
    return NextResponse.json({ url, urls: [url] });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const segs = getSegments(resolvedParams);
  const path = segs.join("/").toLowerCase();

  let body: any = {};
  try {
    body = sanitize(await req.json());
  } catch {
    body = {};
  }

  // Profile update
  if (path === "profile") {
    if (db.users[0]) {
      if (body.ad) db.users[0].ad = body.ad;
      if (body.soyad) db.users[0].soyad = body.soyad;
      if (body.telefon) db.users[0].phone = body.telefon;
    }
    return NextResponse.json({ ok: true, user: db.users[0] });
  }

  // Store profile update: PUT /api/store/me/:id
  if (segs[0] === "store" && segs[1] === "me" && segs[2]) {
    const id = Number(segs[2]);
    const idx = db.stores.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.stores[idx] = { ...db.stores[idx], ...body };
      return NextResponse.json(db.stores[idx]);
    }
    return NextResponse.json(db.stores[0]);
  }

  // Store settings: PUT /api/store/:id/settings
  if (segs[0] === "store" && segs[2] === "settings") {
    const storeId = Number(segs[1]);
    db.storeSettings[storeId] = { ...db.getStoreSettings(storeId), ...body };
    return NextResponse.json(db.storeSettings[storeId]);
  }

  // Store product update: PUT /api/store/:id/products/:productId
  if (segs[0] === "store" && segs[2] === "products" && segs[3]) {
    const prodId = Number(segs[3]);
    const idx = db.products.findIndex((p) => p.id === prodId);
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...body };
      return NextResponse.json(db.products[idx]);
    }
  }

  // Store order status: PUT /api/store/:id/orders/:orderId/status
  if (segs[0] === "store" && segs[2] === "orders" && segs[4] === "status") {
    const orderId = Number(segs[3]);
    const ord = db.orders.find((o) => o.id === orderId);
    if (ord) {
      ord.status = body.status;
      return NextResponse.json(ord);
    }
  }

  // Store review reply: PUT /api/store/:id/reviews/:reviewId/reply
  if (segs[0] === "store" && segs[2] === "reviews" && segs[4] === "reply") {
    const revId = Number(segs[3]);
    const rev = db.reviews.find((r) => r.id === revId);
    if (rev) {
      rev.storeReply = body.reply;
      return NextResponse.json(rev);
    }
  }

  // Admin order status: PUT /api/admin/orders/:id/status
  if (segs[0] === "admin" && segs[1] === "orders" && segs[3] === "status") {
    const id = Number(segs[2]);
    const ord = db.orders.find((o) => o.id === id);
    if (ord) {
      ord.status = body.status;
      if (body.reason) ord.cancelReason = body.reason;
      return NextResponse.json(ord);
    }
  }

  // Admin content update: PUT /api/admin/content
  if (path === "admin/content") {
    db.content = { ...db.content, ...body };
    return NextResponse.json(db.content);
  }

  // Admin category update
  if (segs[0] === "admin" && segs[1] === "categories") {
    const catName = decodeURIComponent(segs[2] || "");
    const idx = db.categories.findIndex((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (idx !== -1) {
      db.categories[idx] = { ...db.categories[idx], ...body };
      return NextResponse.json(db.categories[idx]);
    }
  }

  // Admin store update
  if (segs[0] === "admin" && segs[1] === "stores" && segs[2]) {
    const id = Number(segs[2]);
    const idx = db.stores.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.stores[idx] = { ...db.stores[idx], ...body };
      return NextResponse.json(db.stores[idx]);
    }
  }

  // Admin product update
  if (segs[0] === "admin" && segs[1] === "products" && segs[2]) {
    const id = Number(segs[2]);
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...body };
      return NextResponse.json(db.products[idx]);
    }
  }

  // Standard product update: PUT /api/products/:id
  if (segs[0] === "products" && segs[1]) {
    const id = Number(segs[1]);
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...body };
      return NextResponse.json(db.products[idx]);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const segs = getSegments(resolvedParams);
  const path = segs.join("/").toLowerCase();

  // Cart item delete
  if (segs[0] === "cart" && segs[1]) {
    const id = Number(segs[1]);
    db.cart = db.cart.filter((c) => c.id !== id);
    return NextResponse.json(db.cart);
  }

  // Favorite delete
  if (segs[0] === "favorites" && segs[1]) {
    const id = Number(segs[1]);
    db.favorites = db.favorites.filter((f) => f !== id);
    return NextResponse.json(db.favorites);
  }

  // Store product delete: DELETE /api/store/:id/products/:productId
  if (segs[0] === "store" && segs[2] === "products" && segs[3]) {
    const prodId = Number(segs[3]);
    db.products = db.products.filter((p) => p.id !== prodId);
    return NextResponse.json({ ok: true });
  }

  // Admin product delete: DELETE /api/admin/products/:id
  if (segs[0] === "admin" && segs[1] === "products" && segs[2]) {
    const id = Number(segs[2]);
    db.products = db.products.filter((p) => p.id !== id);
    return NextResponse.json({ ok: true });
  }

  // Admin store delete: DELETE /api/admin/stores/:id
  if (segs[0] === "admin" && segs[1] === "stores" && segs[2]) {
    const id = Number(segs[2]);
    db.stores = db.stores.filter((s) => s.id !== id);
    return NextResponse.json({ ok: true });
  }

  // Admin coupon delete: DELETE /api/admin/coupons/:id
  if (segs[0] === "admin" && segs[1] === "coupons" && segs[2]) {
    const id = Number(segs[2]);
    db.coupons = db.coupons.filter((c) => c.id !== id);
    return NextResponse.json({ ok: true });
  }

  // Admin order delete: DELETE /api/admin/orders/:id
  if (segs[0] === "admin" && segs[1] === "orders" && segs[2]) {
    const id = Number(segs[2]);
    db.orders = db.orders.filter((o) => o.id !== id);
    return NextResponse.json({ ok: true });
  }

  // Admin user delete: DELETE /api/admin/users/:id
  if (segs[0] === "admin" && segs[1] === "users" && segs[2]) {
    const id = Number(segs[2]);
    db.users = db.users.filter((u) => u.id !== id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
