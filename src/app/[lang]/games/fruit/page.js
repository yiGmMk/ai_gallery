import { getDictionary } from "@/app/dictionaries";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from '@/app/components/BlogMarkdown';
import FruitGame from "./content";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.fruit.title,
      description: dict.seo.fruit.description,
      keywords: dict.seo.fruit.keywords,
      publishedDate: "2024-10-25T02:00:00.000Z",
      updatedDate: "2024-11-19T09:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/games/fruit`,
      languages: {
        "en": "https://games.programnotes.cn/en/games/fruit",
        "zh-CN": "https://games.programnotes.cn/zh/games/fruit",
        "x-default": "https://games.programnotes.cn/en/games/fruit",
      },
    },
  };
}

export default function FruitPage({ params: { lang } }) {

  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/fruit`} />
      <FruitGame />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/games/fruit" />
      <CommonComments lang={lang} />
    </>
  );
}