# API arayışı

API ASP.NET Core tətbiqində yerləşir və marşrutların kökü `/api`-dir. Əsas marşrutlar URL-də versiya seqmenti daşımır. Versiya göstərilməzsə API v1.0 qəbul edir; istəyə görə `?api-version=1.0` və ya `X-Api-Version: 1.0` istifadə oluna bilər.

Development mühitində OpenAPI sənədi `/openapi/v1.json`, Scalar UI isə `/scalar` ünvanında açılır. Bu iki endpoint production-da aktiv edilmir.

## Cavab formatı və autentifikasiya

- JSON sahələri camelCase, enum dəyərləri sətir kimi serializasiya olunur.
- Model validasiyası və tətbiq xətaları əsasən `{ "error": "..." }` formatında qaytarılır.
- Token tələb edən sorğularda `Authorization: Bearer <JWT>` başlığını göndərin.
- Ümumi limit: IP başına dəqiqədə 120 sorğu. Auth: 10/dəq; məhsul kataloqu: 40/dəq; kupon yoxlaması: 8/dəq. Limit keçildikdə `429` qaytarılır.

## Alıcı üçün açıq marşrutlar

| Metod | Marşrut | Təsviri |
| --- | --- | --- |
| GET | `/api/products` | Kataloq; `search`, `category`, `subcategory`, `sort`, `minPrice`, `maxPrice`, `discount`, `store`, `page`, `pageSize` sorğu parametrləri |
| GET | `/api/products/{id}` | Məhsulu ID ilə alır |
| GET | `/api/products/slug/{slug}` | Məhsulu SEO slug ilə alır |
| GET | `/api/categories` | Kateqoriyalar |
| GET | `/api/stores` | Mağazaların siyahısı |
| GET | `/api/stores/{id}` | Mağazanı ID ilə alır |
| GET | `/api/stores/by-url/{slug}` | Mağazanı slug ilə alır |
| GET | `/api/content` | Sayt məzmunu |
| GET | `/api/content/{key}` | Məzmun elementini açarla alır |
| GET | `/api/reviews/{productId}` | Məhsul rəyləri |
| GET | `/api/payments/config` | Frontend üçün ödəniş konfiqurasiyası |
| GET | `/api/health` | API sağlamlıq xülasəsi |
| GET | `/health/live` | Liveness yoxlaması |
| GET | `/health/ready` | Verilənlər bazası readiness yoxlaması |

## Autentifikasiya və profil

| Metod | Marşrut | Giriş |
| --- | --- | --- |
| POST | `/api/auth/register` | Açıq |
| POST | `/api/auth/verify-email` | Açıq |
| POST | `/api/auth/resend-verification` | Açıq |
| POST | `/api/auth/login` | Açıq |
| POST | `/api/auth/login-verify` | Açıq |
| POST | `/api/auth/resend-login` | Açıq |
| POST | `/api/auth/forgot` | Açıq |
| POST | `/api/auth/reset` | Açıq |
| POST | `/api/auth/google` | Açıq |
| GET | `/api/auth/me` | JWT |
| GET/POST/PUT/DELETE | `/api/addresses` və `/api/addresses/{id}` | JWT |
| PUT | `/api/profile` | JWT |
| PUT | `/api/profile/measurements` | JWT |
| POST | `/api/profile/password` | JWT |
| GET/POST/PUT/DELETE | `/api/cart`, `/api/cart/{productId}` | JWT |
| GET | `/api/favorites`, `/api/favorites/ids` | JWT |
| POST/DELETE | `/api/favorites/{productId}` | JWT |
| GET | `/api/notifications` | JWT |
| POST | `/api/notifications/read`, `/api/notifications/{id}/read` | JWT |
| GET/POST | `/api/size-recommendation/{productId}`, `/api/size-recommendation` | JWT |

## Checkout və sifarişlər

| Metod | Marşrut | Giriş |
| --- | --- | --- |
| POST | `/api/coupons/validate` | Açıq; coupon rate limit |
| POST | `/api/delivery/quote` | JWT |
| GET/POST | `/api/orders` | JWT |
| GET | `/api/orders/{id}` | JWT |
| POST | `/api/orders/{id}/cancel` | JWT |
| POST | `/api/orders/{id}/problem` | JWT |
| POST | `/api/orders/{id}/dispute` | JWT; köhnə şikayət axını |
| GET | `/api/problems/my` | JWT |
| GET | `/api/problems/{id}` | JWT |
| POST | `/api/problems/{id}/cancel` | JWT |
| POST | `/api/payments/webhook` | Açıq; imzanın yoxlanması ödəniş provayderindən asılıdır |

## Satıcı paneli

Bu marşrutlar JWT tələb edir; servis qatında mağaza sahibliyi də yoxlanılır.

- `GET /api/store/me`; `PUT /api/store/me/{id}`
- `GET /api/store/{id}/settings`, `/dashboard`, `/analytics`, `/finance`
- Məhsullar: `GET/POST /api/store/{id}/products`; `PUT/DELETE /api/store/{id}/products/{pid}`
- Sifarişlər: `GET /api/store/{id}/orders`; `PUT /api/store/{id}/orders/{oid}/status`; `POST /api/store/{id}/orders/{oid}/courier`
- Problemlər: `GET /api/store/{id}/problems`; `POST /api/store/{id}/problems/{pid}/respond`; `POST /api/store/{id}/problems/{pid}/received`
- Rəylər: `GET /api/store/{id}/reviews`; `PUT /api/store/{id}/reviews/{rid}/reply`

## Admin paneli

Admin marşrutları `Admin` policy-si ilə qorunur.

- Problemlər, mübahisələr və audit: `/api/admin/problems`, `/api/admin/disputes`, `/api/admin/activity`
- Analitika: `/api/admin/stats`, `/api/admin/analytics`, mağaza detalları
- İstifadəçilər: `/api/admin/users` və `/api/admin/users/{id}` əməliyyatları
- Məhsullar: `/api/admin/products`, approval, bulk əməliyyatı və silmə
- Mağazalar: `/api/admin/stores` və mağaza detalları
- Kuponlar: `/api/admin/coupons`
- Kateqoriyalar: `/api/admin/categories`
- Sifarişlər: `/api/admin/orders`
- Rəylər: `/api/admin/reviews`
- Komissiyalar və ödəniş çıxarışları: `/api/admin/stores/{storeId}/commissions`, `/api/admin/stores/{storeId}/payouts`
- Mətn məzmunu: `PUT /api/admin/content/{key}`
- Şəkil backfill: `POST /api/admin/maintenance/images/backfill`

## Səhvləri araşdırma

1. `401` token çatışmadığını və ya etibarsız olduğunu, `403` isə istifadəçinin policy/ownership tələbinə cavab vermədiyini göstərə bilər.
2. `429` IP üzrə limit keçildiyini göstərir.
3. `/health/ready` uğursuzdursa PostgreSQL bağlantısını və migration vəziyyətini yoxlayın.
4. Development-də `/scalar` və `/openapi/v1.json` endpoint-lərindən sorğu sxemlərini və cavabları yoxlayın.

Bu arayış marşrut inventarıdır; bütün DTO sahələrinin və mümkün status kodlarının tam sxemini əvəz etmir.
