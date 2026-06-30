// E2e smoke (C.1): müştəri axını — home → login → məhsul → səbət → checkout.
// API Playwright `route` ilə mock-lanır → backend/DB/OTP/SMTP lazım deyil, deterministik yaşıl.
// Real-backend variantı üçün: mock-ları söndür, backend qaldır (seed DB), OTP üçün dev-mail seam əlavə et.
import { test, expect, type Page } from "@playwright/test";

const PROD = {
  id: 1, name: "Mok Köynək", price: 50, category: "Kişi", store: "MokMağaza",
  imageUrls: [], sizes: ["S", "M", "L"], sizeStock: {}, rating: 4, reviews: 3,
};
const USER = { id: 1, ad: "Test", soyad: "User", email: "test@x.az", hasPassword: true, addresses: [], measurements: {} };
const CART_ITEM = { id: 1, name: "Mok Köynək", price: 50, qty: 1, store: "MokMağaza", imageUrls: [], size: "M" };

async function mockApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const m = route.request().method();
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    if (path.endsWith("/api/products")) return json({ products: [PROD] });
    if (path.endsWith("/api/stores")) return json([]);
    if (path.endsWith("/api/categories")) return json([{ name: "Kişi", count: 1, subcategories: [] }]);
    if (path.endsWith("/api/auth/login")) return json({ token: "tok", user: USER });   // OTP-siz mock token
    if (path.endsWith("/api/auth/me")) return json(USER);
    if (path.endsWith("/api/cart")) return json(m === "POST" ? [CART_ITEM] : []);
    if (path.includes("/api/favorites")) return json([]);
    if (path.includes("/api/delivery/quote")) return json({ fee: 3, standardFee: 3, expressFee: 8, free: false, hasCoords: false });
    if (path.includes("/api/reviews")) return json([]);
    if (path.includes("/api/size-recommendation")) return json({ size: "M", hasMeasurements: false, accuracy: 60, fits: true, available: true, alternative: null, fit: "", risks: [], reasons: [], system: "INT", confidence: 60, message: "" });
    return json({});
  });
}

test.beforeEach(async ({ page }) => { await mockApi(page); });

test("home açılır və CTA kataloqa keçir", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Alış-verişə başla" })).toBeVisible();
  await page.getByRole("button", { name: "Alış-verişə başla" }).click();
  await expect(page).toHaveURL(/#\/catalog/);
});

test("login → məhsul → səbət → checkout", async ({ page }) => {
  await page.goto("/#/login");
  await page.getByPlaceholder("email@numune.com").fill(USER.email);
  await page.getByPlaceholder("••••••••••••").fill("123456");
  await page.getByRole("button", { name: "Daxil ol", exact: true }).click();

  // Girişdən sonra header görünür → SPA naviqasiya (hash-only goto reload etmir)
  await page.locator("header").getByRole("button", { name: "Kişi", exact: true }).click();
  await expect(page).toHaveURL(/#\/catalog/);
  await page.getByText("Mok Köynək").click();
  await expect(page).toHaveURL(/#\/product/);

  await page.getByRole("button", { name: /Səbətə əlavə et/ }).first().click();

  // Header səbət ikonu popup açır → "Səbətə keç →" ilə SPA naviqasiya (reload yox → cart qalır)
  await page.locator("header").getByRole("button", { name: "Səbət" }).click();
  await page.getByRole("button", { name: "Səbətə keç →" }).click();
  await expect(page).toHaveURL(/#\/cart/);
  await expect(page.getByText("Mok Köynək")).toBeVisible();

  await page.getByRole("button", { name: /Sifarişi rəsmiləşdir/ }).click();
  await expect(page).toHaveURL(/#\/checkout/);
});
