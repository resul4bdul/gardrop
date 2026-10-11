# Gardrop

Gardrop Azərbaycandakı geyim mağazalarını alıcılarla birləşdirən çoxsatıcılı marketplace layihəsidir. Alıcılar məhsulları axtarıb sifariş edə, mağazalar isə məhsul və sifarişlərini idarə edə bilirlər.

## Əsas imkanlar

- Məhsul kataloqu, kateqoriyalar, axtarış, filtrlər və mağaza səhifələri
- Email təsdiqi ilə qeydiyyat və giriş, Google giriş dəstəyi, JWT autentifikasiyası
- Səbət, favoritlər, ünvanlar, kuponlar, çatdırılma təklifi və sifarişlərin izlənməsi
- Məhsul variantları və stok, rəylər, ölçü tövsiyəsi
- Satıcı paneli: məhsullar, sifarişlər, rəylər və maliyyə məlumatları
- Admin paneli: kataloq moderasiyası, istifadəçilər, sifarişlər, kuponlar, mübahisələr və analitika

## Texnologiyalar

- **Vitrin və panellər:** Next.js 15, React 19, TypeScript
- **API:** ASP.NET Core / .NET 10
- **Məlumat bazası:** PostgreSQL və Entity Framework Core 10
- **Şəkillər:** lokal disk və ya S3 uyğun obyekt anbarı
- **Deploy üçün nəzərdə tutulan proxy:** nginx, systemd

## Repozitoriyanın quruluşu

| Yol | Təsviri |
| --- | --- |
| `frontend/` | Next.js tətbiqi, vitrin, admin və satıcı səhifələri |
| `backend-csharp/Core/` | Domain modelləri, DTO-lar, tətbiq servisləri və interfeyslər |
| `backend-csharp/Infrastructure/` | PostgreSQL, EF Core, migration-lar və xarici servis implementasiyaları |
| `backend-csharp/Presentation/` | ASP.NET Core API, controller-lər və tətbiqin giriş nöqtəsi |
| `backend-csharp/Tests/` | xUnit test layihəsi |
| `deploy/` | nginx və systemd nümunələri, mövcud deploy qeydləri |
| `Gardrop_Huquqi_Senedler_Yekun.pdf` | Repozitoriyadakı hüquqi sənəd |

Daha ətraflı: [arxitektura](docs/ARCHITECTURE.md), [API marşrutları](docs/API.md), [lokal işə salma və konfiqurasiya](docs/DEVELOPMENT.md).

## Lokal işə salma

Tələblər: .NET SDK 10, PostgreSQL 14 və npm. API və frontend-i ayrı terminallarda başladın.

### 1. Məlumat bazası və API

PostgreSQL-də `gardrop` bazası yaradın. Sonra:

```bash
cd backend-csharp/Presentation
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=gardrop;Username=postgres;Password=<şifrəniz>"
dotnet user-secrets set "Jwt:Secret" "<ən azı 32 simvolluq təsadüfi açar>"
dotnet ef database update -p ../Infrastructure -s .
dotnet run
```

API standart lokal konfiqurasiyada `http://localhost:3001` ünvanında işləyir. İlk işə düşmə zamanı verilənlər bazası seed edilir. Migration əmrləri üçün `dotnet-ef` aləti tələb oluna bilər:

```bash
dotnet tool install --global dotnet-ef
```

### 2. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Vitrin `http://localhost:5173` ünvanında açılır. Admin və satıcı səhifələri müvafiq olaraq `/admin` və `/magaza` yollarındadır. Next.js server tərəfdən API-yə qoşulmaq üçün `API_ORIGIN` dəyişənini qəbul edir; standart dəyər `http://localhost:3001`-dir.

### Testlər və statik yoxlama

```bash
dotnet test backend-csharp/Tests/Gardrop.Tests.csproj
```

Frontend skriptləri:

```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

## Sənədlər və deploy vəziyyəti

Mövcud `deploy/DEPLOY.md`, `deploy/gardrop-next.service` və `start.bat` fayllarında `frontend-next/` qovluğuna istinadlar var. Hazırkı repoda tətbiq `frontend/` qovluğundadır. Deploy nümunələrində həmçinin portlar və `API_BASE_URL` dəyişəni mənbə kodundakı konfiqurasiyadan fərqlənir. Buna görə deploy təlimatları hazırkı checkout üçün yoxlanmış işə salma addımları hesab edilməməlidir; detallar və həll edilməli məqamlar [inkişaf sənədində](docs/DEVELOPMENT.md) qeyd olunub.

## Qeyd

Sənədlər repodakı mənbə kodu və konfiqurasiya fayllarına əsasən hazırlanıb. Payment provider seçiminin real işləkliyi və production deploy konfiqurasiyası ayrıca yoxlanmalıdır.
