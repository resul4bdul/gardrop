import type { Metadata } from "next";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog } from "@/lib/api";

export const metadata: Metadata = { title: "Səbət", robots: { index: false } };

export default async function Page() {
  return <GardropApp initialPath="/cart" initial={await getCatalog()} />;
}
