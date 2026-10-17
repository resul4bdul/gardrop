# Gardrop deploy (self-host Node + .NET, nginx reverse-proxy)

Arxitektura: nginx (:80/:443) → Next.js storefront (:3000, SSR/ISR) + .NET API (:3001) +
köhnə admin/mağaza panelləri (Vite статik, `/admin.html`, `/magaza.html`).

## 1. Backend (.NET API)

```bash
cd /var/www/gardrop/backend-csharp
dotnet publish Presentation/Gardrop.Presentation.csproj -c Release
# Sirlər systemd env-də (deploy/gardrop-api.service): ConnectionStrings__Default, Jwt__Secret,
# Email__AppBaseUrl=https://gardrop.az (reset/verify linkləri buna görə qurulur).
sudo cp deploy/gardrop-api.service /etc/systemd/system/
sudo systemctl enable --now gardrop-api
```

DB miqrasiyaları + seed başlanğıcda avtomatik (DbSeeder). Slug backfill də ilk boot-da işləyir.

## 2. Frontend (Next.js storefront)

```bash
cd /var/www/gardrop/frontend-next
npm ci
API_BASE_URL=http://127.0.0.1:3001 SITE_URL=https://gardrop.az npm run build
sudo cp deploy/gardrop-next.service /etc/systemd/system/
sudo systemctl enable --now gardrop-next
```

> ÖNƏMLİ: `npm run build`-i backend AYAQDA ikən icra et — `/`, `/stores` kimi ISR
> səhifələr build zamanı DB-dən datanı çəkir (sitemap onsuz da force-dynamic).

## 3. Köhnə panellər (admin/mağaza)

```bash
cd /var/www/gardrop/frontend
npm ci && npm run build          # dist/admin.html + dist/magaza.html + assets
sudo mkdir -p /var/www/gardrop-panels
sudo cp -r dist/* /var/www/gardrop-panels/
```

## 4. nginx + HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/gardrop
sudo ln -s /etc/nginx/sites-available/gardrop /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d gardrop.az -d www.gardrop.az
```

## 5. Bir dəfəlik: köhnə şəkil backfill (WebP+thumbnail)

Admin token ilə (Local storage-də):

```bash
curl -X POST https://gardrop.az/api/admin/maintenance/images/backfill \
  -H "Authorization: Bearer <ADMIN_JWT>"
# → { products, scanned, converted, skipped, provider }
```

## 6. Cutover

Domen kökü artıq Next-ə düşür (nginx `location /`). Köhnə müştəri SPA (`frontend` index.html)
söndürülür; yalnız `/admin.html`, `/magaza.html` panelləri qalır. Yeni məhsul/mağaza URL-ləri
slug-lu (`/product/{slug}`, `/store/{slug}`), `#` yoxdur.
