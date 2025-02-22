"use client";
import { useEffect } from 'react';
import Script from 'next/script';
import styles from './GameContainer.module.css';

const SCRIPTS = [
  '/games/fruit/js/phaser.min.js',
  '/games/fruit/js/mathTool.js',
  '/games/fruit/js/flameParticle.js',
  '/games/fruit/js/bladeObj.js',
  '/games/fruit/js/fruitObj.js',
  '/games/fruit/js/bombObj.js',
  '/games/fruit/js/bootScene.js',
  '/games/fruit/js/preloadScene.js',
  '/games/fruit/js/mainScene.js',
  '/games/fruit/js/playScene.js',
  '/games/fruit/js/main.js'
];

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(script);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function FruitGame() {
  useEffect(() => {
    const scripts = [];

    const loadGameScripts = async () => {
      try {
        // 并行加载所有脚本
        await Promise.all(SCRIPTS.map(loadScript));
        console.log("All scripts loaded");
      } catch (error) {
        console.error("Script loading failed:", error);
      }
    };

    loadGameScripts();

    return () => {
      // 清理所有已添加的脚本
      scripts.forEach(script => document.body.removeChild(script));
    };
  }, []);

  return (
    <div id="game" className={styles.container}>
      {/* 使用 Script 组件预加载关键资源（可选） */}
      <Script
        src="/games/fruit/js/phaser.min.js"
        strategy="beforeInteractive"
      />
    </div>
  );
}
