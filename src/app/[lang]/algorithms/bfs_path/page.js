import { getDictionary } from "@/app/dictionaries";
import BFSPathFind from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from "@/app/components/BlogMarkdown";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return PageMeta({
    title: dict.seo.bfs_path.title,
    description: dict.seo.bfs_path.description,
    keywords: dict.seo.bfs_path.keywords,
    canonicalUrl: `https://games.programnotes.cn/${lang}/algorithms/bfs_path`,
    publishedDate: "2024-07-16T02:00:00.000Z",
    updatedDate: "2024-10-22T02:00:00.000Z",
  });
}

export default function BFSPathPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/algorithms/bfs_path`} />
      <BFSPathFind lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/algorithms/bfs_path" />
      <CommonComments lang={lang} />
    </>
  );
}
