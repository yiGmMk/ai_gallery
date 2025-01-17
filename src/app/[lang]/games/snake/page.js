import { getDictionary } from "@/app/dictionaries";
import SnakeGame from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from "@/app/components/BlogMarkdown";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.snake.title,
      description: dict.seo.snake.description,
      keywords: dict.seo.snake.keywords,
      publishedDate: "2024-07-08T02:00:00.000Z",
      updatedDate: "2024-11-19T09:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/games/snake`,
      languages: {
        "en": "https://games.programnotes.cn/en/games/snake",
        "zh-CN": "https://games.programnotes.cn/zh/games/snake",
        "x-default": "https://games.programnotes.cn/en/games/snake",
      },
    },
  };
}

export default function SnakePage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/snake`} />
      <SnakeGame lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/games/snake" />
      <CommonComments lang={lang} />
    </>
  );
}
