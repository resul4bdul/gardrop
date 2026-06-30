# Fit Assistant illüstrasiyaları

Bu qovluğa real illüstrasiya şəkillərini at — wizard avtomatik onları göstərəcək.
Şəkil tapılmazsa təmiz SVG siluetə geri düşür (heç nə sınmır).

## Fayl adı sxemi

```
<kind>-<cins>-<ölçü>.png
```

- **kind**: `shoulder` (çiyin, arxadan) · `tummy` (qarın, yandan) · `waist` (bel, öndən) · `legs` (ayaq)
- **cins**: `kisi` · `qadin`
- **ölçü**: `dar` · `orta` · `genis`  (yalnız `legs` üçün: `qisa` · `orta` · `uzun`)

## Tam dəst (24 fayl)

```
shoulder-kisi-dar.png    shoulder-kisi-orta.png    shoulder-kisi-genis.png
shoulder-qadin-dar.png   shoulder-qadin-orta.png   shoulder-qadin-genis.png
tummy-kisi-dar.png       tummy-kisi-orta.png       tummy-kisi-genis.png
tummy-qadin-dar.png      tummy-qadin-orta.png      tummy-qadin-genis.png
waist-kisi-dar.png       waist-kisi-orta.png       waist-kisi-genis.png
waist-qadin-dar.png      waist-qadin-orta.png      waist-qadin-genis.png
legs-kisi-qisa.png       legs-kisi-orta.png        legs-kisi-uzun.png
legs-qadin-qisa.png      legs-qadin-orta.png       legs-qadin-uzun.png
```

## Tövsiyə
- Şəffaf fonlu **PNG** (və ya SVG — onda uzantını `.png`-dən `.svg`-yə dəyişmək üçün kodu yeniləmək lazımdır).
- Portret (dik) kadr, təxminən 200×215 nisbət; `object-contain` ölçünü tənzimləyir.
- 6-xanalı grid şəklin varsa, ayrıca xanalara kəsməyə kömək edə bilərəm (Pillow).
