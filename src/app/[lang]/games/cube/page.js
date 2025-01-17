import { getDictionary } from "@/app/dictionaries";
import CubeGame from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from '@/app/components/BlogMarkdown';

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.cube.title,
      description: dict.seo.cube.description,
      keywords: dict.seo.cube.keywords,
      publishedDate: "2024-10-25T02:00:00.000Z",
      updatedDate: "2024-11-19T09:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/games/cube`,
      languages: {
        "en": "https://games.programnotes.cn/en/games/cube",
        "zh-CN": "https://games.programnotes.cn/zh/games/cube",
        "x-default": "https://games.programnotes.cn/en/games/cube",
      },
    },
  };
}

export default function CubePage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/cube`} />
      <CubeGame lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/games/cube" />
      <CommonComments lang={lang} />
    </>
  );
}
