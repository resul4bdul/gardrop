import type { Metadata } from "next";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog } from "@/lib/api";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ tab?: string[] }> }) {
  const { tab } = await params;
  const path = tab?.[0] ? `/profile/${tab[0]}` : "/profile";
  return <GardropApp initialPath={path} initial={await getCatalog()} />;
}
