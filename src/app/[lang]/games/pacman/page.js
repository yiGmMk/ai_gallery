import { getDictionary } from "@/app/dictionaries";
import PacmanGame from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from '@/app/components/BlogMarkdown';

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.pacman.title,
      description: dict.seo.pacman.description,
      keywords: dict.seo.pacman.keywords,
      publishedDate: "2024-07-22T02:00:00.000Z",
      updatedDate: "2024-11-19T09:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/games/pacman`,
      languages: {
        "en": "https://games.programnotes.cn/en/games/pacman",
        "zh-CN": "https://games.programnotes.cn/zh/games/pacman", 
        "x-default": "https://games.programnotes.cn/en/games/pacman",
      },
    },
  };
}

export default function PacmanPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/pacman`} />
      <PacmanGame lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/games/pacman" />
      <CommonComments lang={lang} />
    </>
  );
} 