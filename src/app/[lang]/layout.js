import React from "react";
import "@/app/globals.css";
import Navigation from "@/app/components/Navigation";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { getDictionary } from "@/app/i18n/server";
import { I18nProvider } from "@/app/i18n/client";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"

const SUPPORTED_LANGUAGES = ['en', 'zh'];
const CATEGORIES = ["games", "algorithms", "tools", "blog"];

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map(lang => ({ lang }));
}

export default async function Layout({ children, params: { lang, slug = [] } }) {
  const dict = await getDictionary(lang);
  const pathname = `/${lang}/${slug.join('/')}`;

  const rssFileName = lang === 'zh' ? 'rss.xml' : `rss-${lang}.xml`;

  return (
    <html lang={lang}>
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`RSS Feed for AI Gallery`}
          href={`https://games.programnotes.cn/${rssFileName}`}
        />
        <Script id="check-device-and-load-ads" strategy="beforeInteractive">
          {`
            if (window.innerWidth >= 768) {
              const script = document.createElement('script');
              script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3614504270218797";
              script.async = true;
              script.crossOrigin = "anonymous";
              document.head.appendChild(script);
            }
          `}
        </Script>
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "pv9syjwm7h");
            `,
          }}
        />
      </head>
      <body>
        <div className="flex flex-col min-h-screen">
          <nav className="bg-white shadow-md">
            <div className="container mx-auto px-2 sm:px-4 py-3">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <Navigation categories={CATEGORIES} lang={lang} pathname={pathname} />
              </div>
            </div>
          </nav>
          <I18nProvider initialDictionary={dict}>
            <main className="flex-grow container mx-auto mt-6 px-2 sm:px-4"> {children} </main>
          </I18nProvider>
        </div>
        <SpeedInsights />
      </body>
      <GoogleAnalytics gaId="G-LXMD3Q0W08" />
      <Analytics mode="production" />;
      {/* <WebVitals /> */}
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="ba7ae691-fd28-4162-bc89-8976d7488fac"
        strategy="afterInteractive"
        data-domains="games.programnotes.cn"
      />
      {/* <Script
        src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='{"token": "29fc062c6fbd41318027e723a3589333"}'
        strategy="afterInteractive"
      /> */}
    </html>
  );
}