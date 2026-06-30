// Real-backend e2e (C.1 ops). Mock YOX — canlı API :3001 (proxy 5173/api) + seed DB-yə qarşı.
// Defolt atlanır (mock smoke yaşıl qalsın). İşə sal:
//   1) backend: cd backend-csharp && dotnet run   (Development → /api/dev/last-code aktiv)
//   2) E2E_REAL=1 npm run e2e
// OTP: kod emaildən deyil, Development dev-mail seam-dən (/api/dev/last-code) gəlir.
// Giriş API ilə tamamlanır (token sessionStorage-ə yazılır) — flaky OTP UI-dən qaçırıq.
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

const SEED = { email: "resul4bdul@gmail.com", password: "123456" };  // DbSeeder demo (admin)

test.skip(!process.env.E2E_REAL, "Real backend lazım — E2E_REAL=1 ilə işə sal.");
// Serial: hər iki test eyni email üçün OTP yaradır → paralel işləsə dev-seam kodu yarışar.
test.describe.configure({ mode: "serial" });

// Token bir dəfə alınır, testlər arası cache olunur (auth rate-limiter-i təkrar vurmamaq üçün).
let cachedToken: string | undefined;

// Parol → OTP (dev seam) → login-verify → token; token sessionStorage-ə yazılır (App re-auth edir).
async function login(page: Page, request: APIRequestContext, email: string, password: string): Promise<string> {
  if (!cachedToken) {
    await request.post("/api/auth/login", { data: { email, password } });
    const cr = await request.get(`/api/dev/last-code?email=${encodeURIComponent(email)}`);
    const { code } = await cr.json();
    expect(code, "dev-mail seam kod qaytarmalıdır (backend Development?)").toBeTruthy();
    const vr = await request.post("/api/auth/login-verify", { data: { email, code } });
    const { token } = await vr.json();
    expect(token, "login-verify token qaytarmalıdır").toBeTruthy();
    cachedToken = token;
  }
  await page.goto("/");
  await page.evaluate((t) => sessionStorage.setItem("gd_token", t), cachedToken!);
  await page.reload();
  return cachedToken!;
}

// Real seed-ə qarşı tam axın: giriş (dev-seam OTP) → kataloq → məhsul → stokda olan ölçü seç
// → səbət → checkout. AI default ölçü stokda olmaya bilər → açıq-aşkar stokda ölçü seçirik.
test("real: giriş → kataloq → məhsul → səbət → checkout", async ({ page, request }) => {
  await login(page, request, SEED.email, SEED.password);
  await expect(page.locator("header")).toBeVisible();

  await page.locator("header").getByRole("button", { name: "Kişi", exact: true }).click();
  await expect(page).toHaveURL(/#\/catalog/);
  await page.locator(".cursor-pointer.group").first().click();
  await expect(page).toHaveURL(/#\/product/);

  // Stokda olan ilk ölçü düyməsini seç (deaktiv olmayan) → "Səbətə əlavə et" aktivləşir
  const sizeBtn = page.locator("button.min-w-12:not([disabled])").first();
  if (await sizeBtn.isVisible().catch(() => false)) await sizeBtn.click();
  await page.getByRole("button", { name: "Səbətə əlavə et", exact: true }).click();

  await page.locator("header").getByRole("button", { name: "Səbət" }).click();
  await page.getByRole("button", { name: "Səbətə keç →" }).click();
  await expect(page).toHaveURL(/#\/cart/);
  await page.getByRole("button", { name: /Sifarişi rəsmiləşdir/ }).click();
  await expect(page).toHaveURL(/#\/checkout/);
});

test("real: admin paneli token ilə açılır", async ({ page, request }) => {
  await login(page, request, SEED.email, SEED.password);  // seed user IsAdmin=true
  await page.goto("/admin.html");  // eyni origin → gd_token sessionStorage-də qalır → AdminApp re-auth
  await expect(page.getByText(/Məhsul|Sifariş|İstifadəçi|İdarə|Panel|Daşbord|Statistik/).first()).toBeVisible({ timeout: 15000 });
});
