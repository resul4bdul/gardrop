import type { Metadata } from "next";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = { title: "Məxfilik siyasəti", alternates: { canonical: "/privacy" } };

export default async function Page() {
  return <GardropApp initialPath="/privacy" initial={await getCatalog()} />;
}
