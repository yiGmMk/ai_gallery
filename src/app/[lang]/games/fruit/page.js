import { getDictionary } from "@/app/dictionaries";
import { PageMeta } from "@/app/components/Meta";
import PageHeader from "@/app/components/PageHeader";
import CommonComments from "@/app/components/GiscusComments";
import BlogMarkdown from '@/app/components/BlogMarkdown';
import { useEffect, useRef } from "react";

export async function generateMetadata({ params: { lang } }) {
  const dict = await getDictionary(lang);
  return {
    ...PageMeta({
      title: dict.seo.fruit.title,
      description: dict.seo.fruit.description,
      keywords: dict.seo.fruit.keywords,
      publishedDate: "2024-10-25T02:00:00.000Z",
      updatedDate: "2024-11-19T09:00:00.000Z",
    }),
    alternates: {
      canonical: `https://games.programnotes.cn/${lang}/games/fruit`,
      languages: {
        "en": "https://games.programnotes.cn/en/games/fruit",
        "zh-CN": "https://games.programnotes.cn/zh/games/fruit",
        "x-default": "https://games.programnotes.cn/en/games/fruit",
      },
    },
  };
}

export default function FruitPage({ params: { lang } }) {
  const gameContainerRef = useRef(null);

  useEffect(() => {
    const loadGame = async () => {
      // Dynamically import the game scripts.
      await import('./js/phaser.min.js');
      await import('./js/mathTool.js');
      await import('./js/bombObj.js');
      await import('./js/fruitObj.js');
      await import('./js/bladeObj.js');
      await import('./js/bootScene.js');
      await import('./js/preloadScene.js');
      await import('./js/flameParticle.js');
      await import('./js/mainScene.js');
      await import('./js/playScene.js');
      await import('./js/main.js');

      // Defer Phaser initialization
      setTimeout(() => {
        // Your Phaser game initialization code here.
        // For example:
        // new Phaser.Game(config);  // Assuming config is defined in your imported files
        // or
        // window.game = new Phaser.Game(config);
      }, 1); // Small delay
    };

    loadGame();

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <>
      <PageHeader lang={lang} pathname={`/${lang}/games/fruit`} />
      <div id="game" className="game" ref={gameContainerRef}></div>
      <BlogMarkdown lang={lang} directory="src/app/[lang]/games/fruit" />
      <CommonComments lang={lang} />

      <style jsx global>{`
        body {
          margin: 0px;
        }
      `}</style>
    </>
  );
}