# Gardrop Backend

Gardrop.az geyim marketplace-inin API-si — **.NET 10 · EF Core · PostgreSQL · JWT**.

## Arxitektura (Onion / Clean)

Asılılıq içəriyə doğru: **Presentation → Application → Domain**. Infrastructure yalnız interfeysləri implement edir.

| Layihə | Rol |
| ------ | --- |
| `Core/` (`Gardrop.Core`) | **Domain** (entity/enum) + **Application** (servislər, DTO, interfeyslər). Xarici asılılıq yoxdur. |
| `Infrastructure/` | EF `AppDbContext`, migrationlar, xarici servislər (email/storage/JWT/ödəniş). |
| `Presentation/` | ASP.NET Core Web API — nazik controller-lər, `Program.cs`, config. |
| `Tests/` | xUnit (in-memory EF) — 99 test. |

**Təbəqə izolyasiyası:** Application servisləri yalnız `IAppDbContext` interfeysi ilə işləyir (concrete `AppDbContext` inject olunmur) — DB/ORM dəyişsə yalnız Infrastructure dəyişir.

## Tələblər

- .NET SDK 10
- PostgreSQL 14+
- `dotnet tool install --global dotnet-ef` (migration üçün)

## Lokal işə salma

```bash
cd Presentation
# 1) Sirləri user-secrets-ə yaz (repo-ya düşmür):
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=gardrop;Username=postgres;Password=..."
dotnet user-secrets set "Jwt:Secret" "<ən azı 32 simvol təsadüfi açar>"
# 2) DB sxemini qur:
dotnet ef database update -p ../Infrastructure -s .
# 3) İşə sal (http://localhost:3001):
dotnet run
```

Dev-də seed avtomatik işləyir (mağaza/kateqoriya/məhsul/komissiya 10%). Demo admin: `DbSeeder`-ə bax.

## Konfiqurasiya

`appsettings.json` = **sirsiz** baza (struktur + logging + defaults). **Sirlər burada saxlanmır.**

- **Dev:** `dotnet user-secrets set "Açar:Alt" "dəyər"`
- **Prod:** environment variable — JSON `A:B` → env `A__B` (ikiqat alt-xətt).

| Açar | Env | Qeyd |
| ---- | --- | ---- |
| `ConnectionStrings:Default` | `ConnectionStrings__Default` | **prod-da məcburi** |
| `Jwt:Secret` | `Jwt__Secret` | **≥32 simvol, prod-da məcburi** |
| `Cors:Origins` | `Cors__Origins__0` | prod-da boş = açılış xətası |
| `Smtp:*` | `Smtp__*` | email (boşdursa email no-op) |
| `Google:ClientId` | `Google__ClientId` | Google login |
| `Storage:Provider` | `Storage__Provider` | `Local` \| `S3` (S3 açarları env) |

Prod-da `ConnectionStrings:Default` və ya `Jwt:Secret` boş/zəifdirsə tətbiq **açılışda dayanır** (fail-fast).

## Migrationlar

```bash
dotnet ef migrations add <Ad> -p ../Infrastructure -s .
dotnet ef database update       -p ../Infrastructure -s .
```

## Test

```bash
dotnet test Tests/Gardrop.Tests.csproj    # 99 test (in-memory EF)
```

## Əsas özəlliklər

- **Auth:** 2-addımlı OTP login/register (email kod), JWT, Google login, şifrə dəyişmə.
- **Kataloq:** məhsul + **variant matrisi** (ölçü×rəng×SKU×stok), kateqoriya ağacı, axtarış/filtr.
- **Sifariş:** server-tərəf cəm, kupon, çatdırılma məsafə-əsaslı, ekspress 30dq auto-cancel, live-status (bir-yönlü).
- **Ölçü mühərriki:** Strategy pattern (`ISizeRecommenderStrategy` → geyim/ayaqqabı/custom), `ISizeChartProvider` (EN13402/TR) — DB-driven-a hazır seam.
- **Maliyyə:** kateqoriya-əsaslı komissiya, **payout/settlement** (admin), mağaza net/balans.
- **Moderasiya:** məhsul təsdiqi (Pending→Approved/Rejected).
- **Dispute & Refund:** müştəri şikayət → admin refund/ödəniş-dondur/rədd. **Activity log** (audit feed).

## Təhlükəsizlik

- **Rate limiting:** global per-IP 120/dəq + `auth` 10/dəq + `search` 40/dəq.
- **Input sanitization:** `InputSanitizer` (control/zero-width/bidi simvol təmizləmə) bütün user mətnlərində; email-də `HtmlEncoder`.
- **SQLi:** EF parametrləşdirir (raw SQL yalnız seed-də). **XSS:** frontend React auto-escape.
- Soft-delete qlobal filtr; ownership yoxlaması (satıcı yalnız öz datası).
