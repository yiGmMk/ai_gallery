import { getDictionary } from "@/app/dictionaries";
import Minesweeper from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from "@/app/components/BlogMarkdown";

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
      canonical: `https://gallery.selfboot.cn/${lang}/games/minesweeper`,
      languages: {
        "en": "https://gallery.selfboot.cn/en/games/minesweeper",
        "zh-CN": "https://gallery.selfboot.cn/zh/games/minesweeper",
        "x-default": "https://gallery.selfboot.cn/en/games/minesweeper",
      },
    },
  };
}

export default function MinesweeperPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/minesweeper`} />
      <Minesweeper lang={lang}/>
      <BlogMarkdown lang={lang} directory="src/app/[lang]/games/minesweeper" />
      <CommonComments lang={lang} />
    </>
  );
}
