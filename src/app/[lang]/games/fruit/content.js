"use client";

import { useEffect, useState } from 'react';
import { loadFruitScripts } from './gameLoader';
import styles from './GameContainer.module.css';

export default function FruitGame({ lang = 'en' }) {
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let ownedGame;
    setError(false);
    loadFruitScripts().then(() => {
      if (!cancelled) ownedGame = window.createFruitGame('game', lang);
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
      if (ownedGame) ownedGame.destroy();
    };
  }, [lang, attempt]);

  return (
    <div id="game" lang={lang} className={styles.container}>
      {error && (
        <div role="alert" className="p-6 text-white">
          <p>{lang === 'zh' ? '游戏加载失败，请检查网络后重试。' : 'Unable to load the game. Check your connection and retry.'}</p>
          <button type="button" className="mt-3 rounded border px-4 py-2" onClick={() => setAttempt(value => value + 1)}>
            {lang === 'zh' ? '重试' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  );
}
