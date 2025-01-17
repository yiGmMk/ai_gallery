import { getDictionary } from "@/app/dictionaries";
import SokobanGame from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from "@/app/components/BlogMarkdown";
import levelsData from "./levels.json";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.sokoban.title,
      description: dict.seo.sokoban.description,
      keywords: dict.seo.sokoban.keywords,
      publishedDate: "2024-11-17T03:00:00.000Z",
      updatedDate: "2024-11-22T10:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/games/sokoban`,
      languages: {
        "en": "https://games.programnotes.cn/en/games/sokoban",
        "zh-CN": "https://games.programnotes.cn/zh/games/sokoban",
        "x-default": "https://games.programnotes.cn/en/games/sokoban",
      },
    },
  };
}

export default function SokobanPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/sokoban`} />
      <SokobanGame lang={lang} levels={levelsData.levels} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/games/sokoban" />
      <CommonComments lang={lang} />
    </>
  );
}
