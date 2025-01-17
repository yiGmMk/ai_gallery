import { getDictionary } from "@/app/dictionaries";
import ConsistentHashRing from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from "@/app/components/BlogMarkdown";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return PageMeta({
    title: dict.seo.hashring.title,
    description: dict.seo.hashring.description,
    keywords: dict.seo.hashring.keywords,
    canonicalUrl: `https://games.programnotes.cn/${lang}/algorithms/hashring`,
    publishedDate: "2024-08-01T04:40:00.000Z",
    updatedDate: "2024-11-07T15:00:00.000Z",
  });
}

export default function HashRingPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/algorithms/hashring`} />
      <ConsistentHashRing lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/algorithms/hashring" />
      <CommonComments lang={lang} />
    </>
  );
}
