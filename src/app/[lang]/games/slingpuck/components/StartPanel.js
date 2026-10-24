"use client";

import React from "react";

const DIFFICULTY_KEYS = {
  easy: "slingpuck_easy",
  normal: "slingpuck_normal",
  hard: "slingpuck_hard",
};

export function StartPanel({ difficulty, onDifficulty, onStart, disabled = false, t }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-b from-black/55 via-black/35 to-black/70 p-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-200/25 bg-[#1b1713]/90 p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">{t("slingpuck_title")}</p>
        <h2 className="mt-3 font-serif text-3xl text-amber-50 sm:text-4xl">{t("slingpuck_title")}</h2>
        <p className="mt-3 text-sm leading-6 text-amber-100/65">{t("slingpuck_how_to")}</p>

        <div className="mt-6 flex items-center justify-center gap-2">
          {Object.entries(DIFFICULTY_KEYS).map(([value, key]) => (
            <button
              key={value}
              type="button"
              aria-pressed={difficulty === value}
              onClick={() => onDifficulty(value)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                difficulty === value
                  ? "border-amber-300/80 bg-amber-300/15 text-amber-100 shadow-[0_0_22px_rgba(252,211,77,0.25)]"
                  : "border-white/10 bg-white/[0.03] text-amber-100/60 hover:border-amber-200/40 hover:text-amber-100"
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className="mt-7 w-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-base font-semibold text-[#21170d] shadow-lg transition hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("slingpuck_start")}
        </button>
        <p className="mt-3 text-xs text-amber-100/45">
          {t("slingpuck_player_count")}: 5 · {t("slingpuck_opponent_count")}: 5
        </p>
      </div>
    </div>
  );
}
