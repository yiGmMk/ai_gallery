import { getDictionary } from "@/app/dictionaries";
import BinarySearchTreeVisualization from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from "@/app/components/BlogMarkdown";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return PageMeta({
    title: dict.seo.binarysearchtree.title,
    description: dict.seo.binarysearchtree.description,
    keywords: dict.seo.binarysearchtree.keywords,
    canonicalUrl: `https://games.programnotes.cn/${lang}/algorithms/binarysearchtree`,
    publishedDate: "2024-08-22T02:00:00.000Z",
    updatedDate: "2024-11-08T02:00:00.000Z",
  });
}

export default function BinarySearchTreePage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/algorithms/binarysearchtree`} />
      <BinarySearchTreeVisualization lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/algorithms/binarysearchtree" />
      <CommonComments lang={lang} />
    </>
  );
}
