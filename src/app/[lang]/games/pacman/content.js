"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/app/i18n/client";
import { Smile, Frown } from "lucide-react";

// 游戏配置常量
const GRID_SIZE = 28;
const CELL_SIZE = 20;

// 单元格类型枚举
const CELL_TYPE = {
  EMPTY: 0,
  WALL: 1, 
  DOT: 2,
  POWER_PELLET: 3,
  PACMAN: 4,
  GHOST: 5
};

// 方向枚举
const DIRECTION = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

function Cell({ type, onClick }) {
  let className = "w-5 h-5 border border-gray-300 flex items-center justify-center";
  
  switch(type) {
    case CELL_TYPE.WALL:
      className += " bg-blue-800";
      break;
    case CELL_TYPE.DOT:
      className += " bg-yellow-200";
      break;
    case CELL_TYPE.POWER_PELLET:
      className += " bg-yellow-400";
      break;
    case CELL_TYPE.PACMAN:
      className += " bg-yellow-500";
      break;
    case CELL_TYPE.GHOST:
      className += " bg-red-500";
      break;
    default:
      className += " bg-black";
  }

  return (
    <div className={className} onClick={onClick}>
      {type === CELL_TYPE.DOT && <div className="w-1 h-1 bg-white rounded-full" />}
      {type === CELL_TYPE.POWER_PELLET && <div className="w-3 h-3 bg-white rounded-full" />}
      {type === CELL_TYPE.PACMAN && "😃"}
      {type === CELL_TYPE.GHOST && "👻"}
    </div>
  );
}

function Board({ grid, onCellClick }) {
  return (
    <div className="grid grid-cols-28 gap-0 bg-black p-2 rounded-lg">
      {grid.map((row, i) =>
        row.map((cell, j) => (
          <Cell
            key={`${i}-${j}`}
            type={cell}
            onClick={() => onCellClick(i, j)}
          />
        ))
      )}
    </div>
  );
}

const PacmanGame = () => {
  const { t } = useI18n();
  const [grid, setGrid] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);

  // 初始化游戏网格
  const initGrid = useCallback(() => {
    const newGrid = Array(GRID_SIZE).fill().map(() => 
      Array(GRID_SIZE).fill(CELL_TYPE.EMPTY)
    );
    // TODO: 添加墙壁、豆子等初始化逻辑
    setGrid(newGrid);
  }, []);

  // 重置游戏
  const resetGame = () => {
    setGameOver(false);
    setGameWon(false);
    setScore(0);
    initGrid();
  };

  // 处理单元格点击
  const handleCellClick = (row, col) => {
    if (gameOver || gameWon) return;
    
    // TODO: 实现移动逻辑
  };

  // 初始化游戏
  useEffect(() => {
    initGrid();
  }, [initGrid]);

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">{t("score")}: {score}</span>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t("reset")}
          </button>
        </div>

        <Board grid={grid} onCellClick={handleCellClick} />

        {(gameOver || gameWon) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg flex flex-col items-center gap-4">
              <div className="text-4xl">
                {gameWon ? <Smile className="text-green-500" /> : <Frown className="text-red-500" />}
              </div>
              <p className="text-xl font-bold">
                {gameWon ? t("you_won") : t("game_over")}
              </p>
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t("play_again")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PacmanGame; 