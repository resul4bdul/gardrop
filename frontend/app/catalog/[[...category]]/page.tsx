import type { Metadata } from "next";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog, SITE_NAME } from "@/lib/api";

export const revalidate = 60;

type Props = { params: Promise<{ category?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = category?.[0] ? decodeURIComponent(category[0]) : "";
  return {
    title: cat && cat !== "Hamısı" ? `${cat} — kataloq` : "Kataloq",
    description: cat && cat !== "Hamısı"
      ? `${cat} kateqoriyasında geyimlər — ${SITE_NAME} marketplace.`
      : `Bütün məhsullar — ${SITE_NAME} geyim marketplace.`,
    alternates: { canonical: cat && cat !== "Hamısı" ? `/catalog/${encodeURIComponent(cat)}` : "/catalog" },
  };
}

export default async function CatalogPage({ params }: Props) {
  const { category } = await params;
  const catalog = await getCatalog();
  const path = category?.[0] ? `/catalog/${category[0]}` : "/catalog";
  return <GardropApp initialPath={path} initial={catalog} />;
}
