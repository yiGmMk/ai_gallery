import { getDictionary } from "@/app/dictionaries";
import TokenBucketVisualization from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return PageMeta({
    title: dict.seo.tokenbucket.title,
    description: dict.seo.tokenbucket.description,
    keywords: dict.seo.tokenbucket.keywords,
    canonicalUrl: `https://games.programnotes.cn/${lang}/algorithms/tokenbucket`,
    publishedDate: "2024-07-15T02:00:00.000Z",
    updatedDate: "2024-07-15T09:00:00.000Z",
  });
}

export default function TokenBucketPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/algorithms/tokenbucket`} />
      <TokenBucketVisualization lang={lang} />
      <CommonComments lang={lang} />
    </>
  );
}
