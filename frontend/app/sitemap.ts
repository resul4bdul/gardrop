import type { MetadataRoute } from "next";
import { getCatalog, SITE_URL } from "@/lib/api";

// Backend build zamanı işləməyə bilər — hər sorğuda təzə qurulur.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  const now = new Date();

  const statics: MetadataRoute.Sitemap = [
    "", "/catalog", "/stores", "/privacy", "/terms", "/cookies", "/delivery", "/returns",
  ].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "daily", priority: p === "" ? 1 : 0.6 }));

  const cats: MetadataRoute.Sitemap = (catalog.categories ?? [])
    .map((c: any) => c?.name ?? c)
    .filter((n: any) => typeof n === "string" && n && n !== "Hamısı")
    .map((n: string) => ({ url: `${SITE_URL}/catalog/${encodeURIComponent(n)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 }));

  const products: MetadataRoute.Sitemap = (catalog.products ?? []).map((p: any) => ({
    url: `${SITE_URL}/product/${p.slug || p.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const stores: MetadataRoute.Sitemap = (catalog.stores ?? []).map((s: any) => ({
    url: `${SITE_URL}/store/${s.storeUrl || s.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...statics, ...cats, ...products, ...stores];
}
