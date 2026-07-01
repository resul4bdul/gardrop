# Gardrop Frontend

Gardrop.az marketplace-in veb interfeysi.

## Stack

React 19 · TypeScript · Vite · TailwindCSS

> **Qeyd:** Müştəri saytı (`src/app`) `gardrop.html`-dən port edilmiş vendored tətbiqdir (`@ts-nocheck`,
> classic JSX runtime — i18n `React.createElement`-i override edir). **Admin** və **Mağaza** panelləri
> isə real TypeScript ilə yenidən yazılıb (`src/admin`, `src/magaza`) — tip-təhlükəsiz, ortaq `lib/` atomları.
> Brend rəng: **emerald #0B8457**. Panellərdə **Dark Mode** var (class-əsaslı, `localStorage` `gardrop_theme`).

## Çoxsəhifəli (MPA) struktur

Üç müstəqil giriş nöqtəsi — hər panel öz HTML + `main` + app + CSS-i ilə:

| URL            | Entry HTML    | App                       | İstifadəçi |
| -------------- | ------------- | ------------------------- | ---------- |
| `/`            | `index.html`  | `src/app/GardropApp.tsx`  | Müştəri    |
| `/admin.html`  | `admin.html`  | `src/admin/AdminApp.tsx`  | Admin      |
| `/magaza.html` | `magaza.html` | `src/magaza/MagazaApp.tsx`| Satıcı     |

```
frontend/
├── index.html · admin.html · magaza.html   # 3 giriş HTML (Leaflet CDN, favicon)
├── public/favicon.svg
├── src/
│   ├── main.tsx                 # / giriş nöqtəsi
│   ├── app/GardropApp.tsx       # müştəri saytı (vendored, @ts-nocheck)
│   ├── admin/                   # admin panel (real TS: AdminApp, Dashboard, Stores, Disputes, ...)
│   ├── magaza/                  # mağaza panel (real TS: MagazaApp, Dashboard, Orders, Products, ...)
│   ├── lib/                     # ortaq atomlar: panelIcons, iosUi, csv
│   ├── styles/globals.css       # @tailwind + orijinal <style>
│   └── vite-env.d.ts
├── eslint.config.js · .prettierrc.json · .editorconfig
├── tailwind.config.ts           # emerald brend rəng, darkMode:'class', radiuslar
├── vite.config.ts               # classic JSX + @ alias + MPA input + dev proxy
└── tsconfig*.json
```

## Routing (URL)

Müştəri saytı **hash-əsaslı** routing işlədir — naviqasiya URL-də görünür və refresh/deep-link
işləyir (statik servis üçün backend SPA-fallback tələb olunmur):
`#/catalog/Qadın` · `#/product/<id>` · `#/store/<id>` · `#/profile/<tab>` · `#/search?q=` · `#/cart` ...

## Skriptlər

| Əmr                 | İş                                              |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Vite dev server (`:5173`, `/api`→`:3001` proxy) |
| `npm run build`     | `tsc -b && vite build` → `dist/` (3 səhifə)     |
| `npm run preview`   | İstehsal build-ini lokal önizlə                 |
| `npm run lint`      | ESLint                                          |
| `npm run format`    | Prettier ilə formatla                           |
| `npm run typecheck` | Tipləri yoxla (`tsc -b`)                        |

## API

App API kökünü çalışma zamanı təyin edir (`location.origin`, `file://` üçün `http://localhost:3001`).
Dev-də Vite `/api` və `/uploads` sorğularını backend-ə (`http://localhost:3001`) proxy edir —
ayrıca env dəyişəni tələb olunmur. İşləməsi üçün backend qoşulmalıdır (bax `../backend-csharp`).
