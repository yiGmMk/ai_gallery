import { getDictionary } from "@/app/dictionaries";
import TemplateList from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.gendocx_temp.title,
      description: dict.seo.gendocx_temp.description,
      keywords: dict.seo.gendocx_temp.keywords,
      publishedDate: "2025-01-08T09:00:00.000Z",
      updatedDate: "2025-01-08T09:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/tools/gendocx/temp`,
      languages: {
        "en": "https://games.programnotes.cn/en/tools/gendocx/temp",
        "zh-CN": "https://games.programnotes.cn/zh/tools/gendocx/temp",
        "x-default": "https://games.programnotes.cn/en/tools/gendocx/temp",
      },
    },
  };
}

export default function TemplatesPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/tools/gendocx/temp`} title="gendocx_templates" />
      <TemplateList lang={lang} />
    </>
  );
}
