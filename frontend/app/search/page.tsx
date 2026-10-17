import type { Metadata } from "next";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog } from "@/lib/api";

export const metadata: Metadata = { title: "Axtarış", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const path = `/search?q=${encodeURIComponent(q ?? "")}`;
  return <GardropApp initialPath={path} initial={await getCatalog()} />;
}
