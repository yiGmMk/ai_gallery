import { getDictionary } from "@/app/dictionaries";
import TetrisGame from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.tetris.title,
      description: dict.seo.tetris.description,
      keywords: dict.seo.tetris.keywords,
      publishedDate: "2024-07-01T02:00:00.000Z",
      updatedDate: "2024-11-19T02:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/games/tetris`,
      languages: {
        "en": "https://games.programnotes.cn/en/games/tetris",
        "zh-CN": "https://games.programnotes.cn/zh/games/tetris",
        "x-default": "https://games.programnotes.cn/en/games/tetris",
      },
    },
  };
}

export default function TetrisPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/tetris`} />
      <TetrisGame lang={lang} />
      <CommonComments lang={lang} />
    </>
  );
}
