import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog, findStore, SITE_NAME, SITE_URL } from "@/lib/api";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s: any = findStore(await getCatalog(), slug);
  if (!s) return { title: "Mağaza tapılmadı" };
  const url = `${SITE_URL}/store/${s.storeUrl || s.id}`;
  return {
    title: `${s.name} — mağaza`,
    description: (s.about || `${s.name} mağazasının məhsulları — ${SITE_NAME}.`).slice(0, 160),
    alternates: { canonical: url },
    openGraph: { title: s.name, url, images: s.logo ? [{ url: s.logo }] : undefined },
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const s: any = findStore(catalog, slug);
  if (!s && (catalog.stores?.length ?? 0) > 0) notFound();

  const jsonLd = s && {
    "@context": "https://schema.org",
    "@type": "Store",
    name: s.name,
    url: `${SITE_URL}/store/${s.storeUrl || s.id}`,
    image: s.logo || undefined,
    description: s.about || undefined,
    aggregateRating: s.rating && s.ratingCount
      ? { "@type": "AggregateRating", ratingValue: s.rating, reviewCount: s.ratingCount }
      : undefined,
  };

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <GardropApp initialPath={`/store/${slug}`} initial={{ ...catalog, store: s }} />
    </>
  );
}
