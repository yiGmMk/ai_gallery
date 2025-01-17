import { getDictionary } from "@/app/dictionaries";
import GenDocx from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from '@/app/components/BlogMarkdown';

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.gendocx.title,
      description: dict.seo.gendocx.description,
      keywords: dict.seo.gendocx.keywords,
      publishedDate: "2024-10-25T02:00:00.000Z",
      updatedDate: "2025-01-08T09:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/tools/gendocx`,
      languages: {
        "en": "https://games.programnotes.cn/en/tools/gendocx",
        "zh-CN": "https://games.programnotes.cn/zh/tools/gendocx",
        "x-default": "https://games.programnotes.cn/en/tools/gendocx",
      },
    },
  };
}

export default function GenDocxPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/tools/gendocx`} />
      <GenDocx lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/tools/gendocx" />
      <CommonComments lang={lang} />
    </>
  );
}
