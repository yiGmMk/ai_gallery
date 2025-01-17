import { getDictionary } from "@/app/dictionaries";
import ImageSubtitleTool from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from '@/app/components/BlogMarkdown';

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.subtitles.title,
      description: dict.seo.subtitles.description,
      keywords: dict.seo.subtitles.keywords,
      publishedDate: "2024-07-28T02:00:00.000Z",
      updatedDate: "2025-01-15T09:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/tools/subtitles`,
      languages: {
        "en": "https://games.programnotes.cn/en/tools/subtitles",
        "zh-CN": "https://games.programnotes.cn/zh/tools/subtitles",
        "x-default": "https://games.programnotes.cn/en/tools/subtitles",
      },
    },
  };
}

export default function SubtitlesPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/tools/subtitles`} />
      <ImageSubtitleTool lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/tools/subtitles" />
      <CommonComments lang={lang} />
    </>
  );
}
