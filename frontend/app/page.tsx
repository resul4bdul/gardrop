import GardropApp from "@/components/store/GardropApp";
import { getCatalog, SITE_NAME, SITE_URL } from "@/lib/api";

export const revalidate = 60;

export default async function HomePage() {
  const catalog = await getCatalog();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GardropApp initialPath="/" initial={catalog} />
    </>
  );
}
