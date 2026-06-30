# Gardrop Frontend

Gardrop.az marketplace-in veb interfeysi.

## Stack

React 19 · TypeScript · Vite · TailwindCSS

> **Qeyd:** UI `gardrop.html` / `admin.html` / `magaza.html`-dən birə-bir (1:1) port edilmiş
> tətbiq fayllarıdır (vendored). Hər biri `@ts-nocheck`-dir və `createRoot` ilə özünü mount edir.
> Klassik JSX runtime tələb olunur (bax `vite.config.ts`) — i18n qatı `React.createElement`-i
> override edir və bu yalnız classic runtime-da tutulur. **Daxili məntiq/dizayn dəyişdirilmir**;
> ona görə bu üç fayl lint/format-dan kənar saxlanılır.

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
│   ├── app/GardropApp.tsx       # müştəri saytı (vendored)
│   ├── admin/{main.tsx,AdminApp.tsx,admin.css}
│   ├── magaza/{main.tsx,MagazaApp.tsx,magaza.css}
│   ├── styles/globals.css       # @tailwind + orijinal <style>
│   └── vite-env.d.ts
├── eslint.config.js · .prettierrc.json · .editorconfig
├── tailwind.config.ts           # brand/accent rəngləri, radiuslar
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
