"use client";

import React from "react";

export function ResultPanel({ winner, onRestart, onMenu, t }) {
  const playerWon = winner === "player";
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-amber-200/25 bg-[#1b1713]/95 p-7 text-center shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-200/60">{t("slingpuck_title")}</p>
        <h2 className="mt-3 font-serif text-3xl text-amber-50">
          {playerWon ? t("slingpuck_you_win") : t("slingpuck_ai_wins")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-amber-100/60">{t("slingpuck_hint")}</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="w-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-2.5 font-semibold text-[#21170d] shadow-lg transition hover:from-amber-200 hover:to-amber-400"
          >
            {t("slingpuck_restart")}
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="w-full rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-amber-100/80 transition hover:border-amber-200/40 hover:text-amber-100"
          >
            {t("slingpuck_change_difficulty")}
          </button>
        </div>
      </div>
    </div>
  );
}
