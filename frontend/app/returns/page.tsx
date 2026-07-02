import type { Metadata } from "next";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = { title: "Geri qaytarma", alternates: { canonical: "/returns" } };

export default async function Page() {
  return <GardropApp initialPath="/returns" initial={await getCatalog()} />;
}
