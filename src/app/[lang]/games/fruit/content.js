"use client";
import { useEffect } from 'react';

export default function FruitGame() {
    useEffect(() => {
        // 加载 Phaser 2 的代码
        const script = document.createElement('script');
        script.src = './js/main.js';
        script.onload = () => {
            // Phaser 2 的代码加载完成后，创建游戏实例
        };
        document.body.appendChild(script);

        return () => {
            // 组件卸载时移除 script 标签
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div id="game">
            {/* Phaser 游戏将在此处渲染 */}
        </div>
    );
}
