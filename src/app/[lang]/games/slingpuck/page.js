import { getDictionary } from "@/app/dictionaries";
import SlingPuckGame from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from '@/app/components/BlogMarkdown';

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.slingpuck.title,
      description: dict.seo.slingpuck.description,
      keywords: dict.seo.slingpuck.keywords,
      publishedDate: "2026-10-24T02:00:00.000Z",
      updatedDate: "2026-10-24T02:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/games/slingpuck`,
      languages: {
        "en": "https://games.programnotes.cn/en/games/slingpuck",
        "zh-CN": "https://games.programnotes.cn/zh/games/slingpuck",
        "x-default": "https://games.programnotes.cn/en/games/slingpuck",
      },
    },
  };
}

export default function SlingPuckPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/slingpuck`} />
      <SlingPuckGame lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/games/slingpuck" />
      <CommonComments lang={lang} />
    </>
  );
}
