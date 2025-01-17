import { getDictionary } from "@/app/dictionaries";
import SudokuGame from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from '@/app/components/BlogMarkdown';

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.sudoku.title,
      description: dict.seo.sudoku.description,
      keywords: dict.seo.sudoku.keywords,
      publishedDate: "2024-10-11T02:00:00.000Z",
      updatedDate: "2024-12-07T12:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/games/sudoku`,
      languages: {
        "en": "https://games.programnotes.cn/en/games/sudoku",
        "zh-CN": "https://games.programnotes.cn/zh/games/sudoku",
        "x-default": "https://games.programnotes.cn/en/games/sudoku",
      },
    },
  };
}

export default function SudokuPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/sudoku`} />
      <SudokuGame lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/games/sudoku" />
      <CommonComments lang={lang} />
    </>
  );
}
