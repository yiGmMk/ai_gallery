import { getDictionary } from "@/app/dictionaries";
import { PageMeta } from "@/app/components/Meta";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return PageMeta({
    title: dict.seo.index.title,
    description: dict.seo.index.description,
    keywords: dict.seo.index.keywords,
    canonicalUrl: `https://games.programnotes.cn/${lang}`,
    publishedDate: "2024-06-15T02:00:00.000Z",
    updatedDate: "2024-06-15T02:00:00.000Z",
  });
}

export default async function Home({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return (
    <></> // redriect now
  );
}
