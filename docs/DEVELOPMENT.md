# Lokal inkişaf və konfiqurasiya

## Tələblər

- .NET SDK 10
- PostgreSQL 14 və ya daha yeni versiya
- Node.js və npm
- Migration yaratmaq və tətbiq etmək üçün `dotnet-ef`

## API-nin başladılması

1. PostgreSQL-də `gardrop` adlı baza yaradın.
2. `backend-csharp/Presentation` qovluğuna keçin.
3. Development sirlərini User Secrets-də saxlayın:

```bash
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=gardrop;Username=postgres;Password=<şifrəniz>"
dotnet user-secrets set "Jwt:Secret" "<ən azı 32 simvolluq təsadüfi açar>"
```

4. Schema migration-larını tətbiq edin və API-ni başladın:

```bash
dotnet ef database update -p ../Infrastructure -s .
dotnet run
```

API standart developer profilində `http://localhost:3001` ünvanında işləyir. Development-də DB seed-i tətbiq startında işləyir. API-nin CORS siyasəti development zamanı konfiqurasiya edilməyibsə istənilən origin-ə icazə verir; bu davranış production üçün keçərli deyil.

## Frontend-in başladılması

Yeni terminalda:

```bash
cd frontend
npm ci
npm run dev
```

Frontend `http://localhost:5173` ünvanında işləyir. Əsas səhifələr:

- `/` — vitrin
- `/catalog` — kataloq
- `/stores` — mağazalar
- `/product/{slug}` — məhsul
- `/store/{slug}` — mağaza
- `/admin` — admin paneli
- `/magaza` — satıcı paneli
- `/profile` — istifadəçi profili

Next.js server tərəfdən API ünvanı üçün `API_ORIGIN` dəyişənini oxuyur; defolt `http://localhost:3001`-dir. `SITE_URL` metadata, canonical və sitemap kimi sayt ünvanı tələb edən hissələr üçün istifadə olunur.

## Test və keyfiyyət yoxlamaları

```bash
dotnet test backend-csharp/Tests/Gardrop.Tests.csproj
```

Frontend layihəsində mövcud skriptlər:

- `npm run typecheck` — TypeScript yoxlaması
- `npm run lint` — lint skripti
- `npm run build` — production build

## Konfiqurasiya qaydaları

Development üçün User Secrets istifadə edin. Production-da JSON açarları mühit dəyişənlərinə ikiqat alt-xəttlə çevrilir:

| Konfiqurasiya açarı | Mühit dəyişəni | Qeyd |
| --- | --- | --- |
| `ConnectionStrings:Default` | `ConnectionStrings__Default` | Production-da məcburidir |
| `Jwt:Secret` | `Jwt__Secret` | Production-da minimum 32 simvol |
| `Cors:Origins:0` | `Cors__Origins__0` | Production origin-i |
| `Smtp:Host` | `Smtp__Host` | Email göndərişi |
| `Google:ClientId` | `Google__ClientId` | Google giriş |
| `Storage:Provider` | `Storage__Provider` | `Local` və ya `S3` |

Mümkün əlavə SMTP, Stripe və S3/MinIO parametrləri üçün `backend-csharp/Presentation/appsettings.example.json` şablonuna baxın. Şablondakı dəyərləri real açar kimi istifadə etməyin. Production-da zəif/boş JWT, boş database connection string və boş CORS origin-lərlə API start etmir.

## Repozitoriyada aşkarlanan sənəd və konfiqurasiya uyğunsuzluqları

Bu məqamlar hazırkı repoda tətbiqin işləmə qaydasını deploy nümunələrindən fərqləndirir:

1. Mənbə kodu `frontend/` qovluğunda yerləşir, amma `start.bat`, `deploy/DEPLOY.md` və `deploy/gardrop-next.service` `frontend-next/` qovluğunu göstərir.
2. `frontend/package.json` Next.js development və start serverini 5173 portuna bağlayır. Deploy nümunəsində isə Next.js 3000 portunda işlədilir və nginx bu porta yönləndirir.
3. Frontend kodu API ünvanı üçün `API_ORIGIN` oxuyur. Deploy fayllarında `API_BASE_URL` göstərilib; bu dəyişən hazırkı mənbə kodunda istifadə edilmir.
4. Admin və satıcı səhifələri hazırkı Next.js tətbiqində `/admin` və `/magaza` route-larıdır. Deploy sənədi isə `frontend/` Vite build-indən `admin.html` və `magaza.html` fayllarının yaradıldığını fərz edir.
5. `Payment:Provider=stripe` nümunə konfiqurasiyası Stripe açarlarını göstərir, amma mövcud dependency injection seçimi Stripe servisindən istifadə etmir; hazırkı kod `CodPaymentService` qeydiyyata alır.

Production deploy-dan əvvəl qovluq yolları, Next.js portu/start skripti, `API_ORIGIN`, nginx marşrutları, ödəniş provayderi və systemd environment dəyərləri birlikdə uyğunlaşdırılmalıdır. Mövcud deploy fayllarında nümunə `CHANGE_ME` dəyərləri də var; onları production sirri kimi saxlamaq olmaz.

## Hazırkı repository qeydləri

- `frontend/.next` build çıxışları repoda izlənir; bunlar Next.js tərəfindən yaradılan fayllardır.
- Repozitoriyanın kökündə `package-lock.json` var, amma ona uyğun kök `package.json` görünmür. Frontend dependency əmrlərini `frontend/` içində icra edin.
- Bu sənəd deploy serverində canlı buraxılışı təsdiqləmir; deploy konfiqurasiyası yuxarıdakı uyğunsuzluqlara görə əvvəlcə uyğunlaşdırılmalıdır.
