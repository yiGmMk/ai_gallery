import { getDictionary } from "@/app/dictionaries";
import HeapVisualization from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from "@/app/components/BlogMarkdown";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return PageMeta({
    title: dict.seo.heap.title,
    description: dict.seo.heap.description,
    keywords: dict.seo.heap.keywords,
    canonicalUrl: `https://games.programnotes.cn/${lang}/algorithms/heap`,
    publishedDate: "2024-07-04T02:00:00.000Z",
    updatedDate: "2024-11-04T02:00:00.000Z",
  });
}

export default function HeapPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/algorithms/heap`} />
      <HeapVisualization lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/algorithms/heap" />
      <CommonComments lang={lang} />
    </>
  );
}
