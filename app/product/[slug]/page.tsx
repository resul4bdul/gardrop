import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog, findProduct, SITE_NAME, SITE_URL, safeJsonLd } from "@/lib/api";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p: any = findProduct(await getCatalog(), slug);
  if (!p) return { title: "Məhsul tapılmadı" };
  const url = `${SITE_URL}/product/${p.slug || p.id}`;
  const img = p.imageUrls?.[0] || p.image;
  return {
    title: `${p.name} — ${p.store || SITE_NAME}`,
    description: (p.description || `${p.name} — ${p.store || SITE_NAME} mağazasından. Qiymət: ${p.price} ₼.`).slice(0, 160),
    alternates: { canonical: url },
    openGraph: { title: p.name, url, images: img ? [{ url: img }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const p: any = findProduct(catalog, slug);
  if (!p && (catalog.products?.length ?? 0) > 0) notFound();

  const jsonLd = p && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.imageUrls?.length ? p.imageUrls : (p.image ? [p.image] : undefined),
    description: p.description || undefined,
    brand: p.store ? { "@type": "Brand", name: p.store } : undefined,
    aggregateRating: p.rating && p.reviewCount
      ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${p.slug || p.id}`,
      priceCurrency: "AZN",
      price: p.price,
      availability: (p.stock ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />}
      <GardropApp initialPath={`/product/${slug}`} initial={{ ...catalog, product: p }} />
    </>
  );
}
