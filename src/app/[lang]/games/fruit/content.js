"use client";
import { useEffect } from 'react';

/**
 * FruitGame component that loads and initializes a Phaser 2 game.
 *
 * This component uses the useEffect hook to dynamically load the Phaser 2 script
 * when the component mounts. Once the script is loaded, it creates an instance of
 * the game. The script is removed from the document when the component unmounts to
 * prevent memory leaks.
 *
 * @returns {JSX.Element} A div element that serves as the container for the Phaser game.
 */
let script;
export default function FruitGame() {
  useEffect(() => {
    // 加载 Phaser 2 的代码
    const phaserScript = document.createElement('script');
    phaserScript.src = '/games/fruit/js/phaser.min.js';

    const mathToolScript = document.createElement('script');
    mathToolScript.src = '/games/fruit/js/mathTool.js';

    const flameParticleScript = document.createElement('script');
    flameParticleScript.src = '/games/fruit/js/flameParticle.js';

    const bladeObjScript = document.createElement('script');
    bladeObjScript.src = '/games/fruit/js/bladeObj.js';

    const fruitObjScript = document.createElement('script');
    fruitObjScript.src = '/games/fruit/js/fruitObj.js';

    const bombObjScript = document.createElement('script');
    bombObjScript.src = '/games/fruit/js/bombObj.js';

    const bootSceneScript = document.createElement('script');
    bootSceneScript.src = '/games/fruit/js/bootScene.js';

    const preloadSceneScript = document.createElement('script');
    preloadSceneScript.src = '/games/fruit/js/preloadScene.js';

    const mainSceneScript = document.createElement('script');
    mainSceneScript.src = '/games/fruit/js/mainScene.js';

    const playSceneScript = document.createElement('script');
    playSceneScript.src = '/games/fruit/js/playScene.js';

    phaserScript.onload = () => {
      document.body.appendChild(mathToolScript);
      mathToolScript.onload = () => {
        document.body.appendChild(flameParticleScript);
        flameParticleScript.onload = () => {
          document.body.appendChild(bladeObjScript);
          bladeObjScript.onload = () => {
            document.body.appendChild(fruitObjScript);
            fruitObjScript.onload = () => {
              document.body.appendChild(bombObjScript);
              bombObjScript.onload = () => {
                document.body.appendChild(bootSceneScript);
                bootSceneScript.onload = () => {
                  document.body.appendChild(preloadSceneScript);
                  preloadSceneScript.onload = () => {
                    document.body.appendChild(mainSceneScript);
                    mainSceneScript.onload = () => {
                      document.body.appendChild(playSceneScript);
                      playSceneScript.onload = () => {
                        script = document.createElement('script');
                        script.src = '/games/fruit/js/main.js';
                        script.onload = () => {
                          // Phaser 2 的代码加载完成后，创建游戏实例
                          console.log("load游戏");
                        };
                        script.onerror = () => {
                          console.error("Failed to load script");
                        };
                        document.body.appendChild(script);
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
    document.body.appendChild(phaserScript);

    return () => {
      // 组件卸载时移除 script 标签
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div id="game">
      {/* Phaser 游戏将在此处渲染 */}
    </div>
  );
}
