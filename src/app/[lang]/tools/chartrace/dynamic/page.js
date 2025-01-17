import { getDictionary } from "@/app/dictionaries";
import { PageMeta } from "@/app/components/Meta";
import DynamicChartsContent from './content';

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);

  return PageMeta({
    title: dict.seo.chartrace.dynamicCharts.title,
    description: dict.seo.chartrace.dynamicCharts.description,
    keywords: dict.seo.chartrace.dynamicCharts.keywords,
    canonicalUrl: `https://games.programnotes.cn/${lang}/tools/chartrace/dynamic`,
    publishedDate: "2024-10-01T02:00:00.000Z",
    updatedDate: "2024-10-03T09:00:00.000Z",
  });
}

export default async function DynamicChartsPage({ params: { lang } }) {
  const dict = await getDictionary(lang);

  return <DynamicChartsContent initialDict={dict} lang={lang} />;
}
