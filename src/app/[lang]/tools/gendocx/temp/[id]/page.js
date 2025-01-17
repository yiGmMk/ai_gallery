import { documentTemplates } from "../../templates";
import { notFound } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import TemplateDocx from "./content";
import BlogMarkdown from "@/app/components/BlogMarkdown";

export async function generateMetadata({ params: { lang, id } }) {
  const template = documentTemplates.find((template) => template.id === id);
  if (!template) return notFound();

  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict[template.id],
      description: dict.gendocx_temp[template.id],
      publishedDate: template.publishedDate,
      updatedDate: template.updatedDate,
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/tools/gendocx/temp/${id}`,
      languages: {
        "en": `https://games.programnotes.cn/en/tools/gendocx/temp/${id}`,
        "zh-CN": `https://games.programnotes.cn/zh/tools/gendocx/temp/${id}`,
        "x-default": `https://games.programnotes.cn/en/tools/gendocx/temp/${id}`,
      },
    },
  };
}

export async function generateStaticParams() {
  return documentTemplates.flatMap((template) =>
    ["en", "zh"].map((lang) => ({
      lang,
      id: template.id,
    }))
  );
}

export default function TemplatePage({ params: { lang, id } }) {
  const template = documentTemplates.find((template) => template.id === id);
  if (!template) return notFound();

  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/tools/gendocx/temp/${id}`} title={template.id} />
      <TemplateDocx lang={lang} template={template} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/tools/gendocx/temp" />
    </>
  );
}
