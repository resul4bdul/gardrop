import type { Metadata } from "next";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog } from "@/lib/api";

export const metadata: Metadata = { title: "Seçilmişlər", robots: { index: false } };

export default async function Page() {
  return <GardropApp initialPath="/favorites" initial={await getCatalog()} />;
}
