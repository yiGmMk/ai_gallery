import { getDictionary } from "@/app/dictionaries";
import DPCoin from "./content";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from "@/app/components/BlogMarkdown";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.dpcoin.title,
      description: dict.seo.dpcoin.description,
      keywords: dict.seo.dpcoin.keywords,
      publishedDate: "2024-07-30T12:40:00.000Z",
      updatedDate: "2024-11-21T04:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/algorithms/dpcoin`,
      languages: {
        "en": "https://games.programnotes.cn/en/algorithms/dpcoin",
        "zh-CN": "https://games.programnotes.cn/zh/algorithms/dpcoin",
        "x-default": "https://games.programnotes.cn/en/algorithms/dpcoin",
      },
    },
  };
}

export default function DPCoinPage({ params: { lang } }) {
  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/algorithms/dpcoin`} />
      <DPCoin lang={lang} />
      <BlogMarkdown lang={lang} directory="src/app/[lang]/algorithms/dpcoin" />
      <CommonComments lang={lang} />
    </>
  );
}
