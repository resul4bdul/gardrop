/* Server-side API klienti — SSR səhifələr backend-dən ilkin datanı bununla çəkir.
   Bütün funksiyalar xəta zamanı null/boş qaytarır: backend əlçatmaz olsa belə
   səhifə render olunur (client shell brauzerdə özü yenidən yükləyir). */
import type { InitialData } from "@/components/store/GardropApp";

const API = process.env.API_ORIGIN ?? "http://localhost:3001";

async function j<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { next: { revalidate } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** Tam katalog kəsiti (məhsul+mağaza+kateqoriya+CMS) — ISR 60s keş. */
export async function getCatalog(): Promise<InitialData> {
  const [p, s, c, co] = await Promise.all([
    j<{ products: any[] }>("/api/products"),
    j<any[]>("/api/stores"),
    j<any[]>("/api/categories"),
    j<Record<string, string>>("/api/content"),
  ]);
  return {
    products: p?.products ?? [],
    stores: s ?? [],
    categories: c ?? [],
    content: co && typeof co === "object" ? co : {},
  };
}

/** Slug (və ya köhnə numeric id) ilə məhsulu katalog kəsitindən tapır —
    client shell ilə eyni obyekt forması (dizayn/davranış fərqi yaranmır). */
export function findProduct(catalog: InitialData, slug: string) {
  const d = decodeURIComponent(slug);
  return (catalog.products ?? []).find(
    (x: any) => String(x.slug || "") === d || String(x.id) === d) ?? null;
}

export function findStore(catalog: InitialData, slug: string) {
  const d = decodeURIComponent(slug);
  return (catalog.stores ?? []).find(
    (x: any) => String(x.storeUrl || "") === d || String(x.id) === d) ?? null;
}

export const SITE_NAME = "Gardrop";
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
