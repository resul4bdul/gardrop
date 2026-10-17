import type { Metadata } from "next";
import GardropApp from "@/components/store/GardropApp";
import { getCatalog, SITE_NAME } from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Mağazalar",
  description: `${SITE_NAME}-dakı bütün mağazalar — yerli geyim brendləri bir yerdə.`,
  alternates: { canonical: "/stores" },
};

export default async function StoresPage() {
  return <GardropApp initialPath="/stores" initial={await getCatalog()} />;
}
