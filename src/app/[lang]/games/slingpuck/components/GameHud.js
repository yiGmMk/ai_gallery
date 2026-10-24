"use client";

import React from "react";
import { formatClock } from "../ui/format";

function CountPill({ label, count, accent }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 shadow-lg backdrop-blur-md">
      <span className={`h-2.5 w-2.5 rounded-full ${accent}`} aria-hidden="true" />
      <span className="text-[11px] uppercase tracking-wider text-amber-100/60">{label}</span>
      <span className="min-w-[1.1rem] text-right font-semibold tabular-nums text-amber-50">{count}</span>
    </div>
  );
}

export function GameHud({
  side,
  freeMode = false,
  counts,
  timeLeft,
  power,
  dragging,
  message,
  muted,
  onToggleSound,
  t,
}) {
  const warning = timeLeft <= 10;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <CountPill label={t("slingpuck_ai")} count={counts.opponent} accent="bg-stone-300" />
        <div className="flex flex-col items-center">
          <div
            className={`rounded-full border px-4 py-1.5 font-mono text-lg tabular-nums shadow-lg backdrop-blur-md ${
              warning
                ? "border-rose-400/60 bg-rose-500/15 text-rose-100"
                : "border-amber-200/30 bg-black/45 text-amber-50"
            }`}
          >
            {freeMode ? t("slingpuck_free_mode") : formatClock(timeLeft)}
          </div>
          {!freeMode && (
            <p className="mt-1.5 max-w-[15rem] text-center text-[11px] leading-4 text-amber-100/65 sm:text-xs">{message}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <CountPill label={t("slingpuck_player")} count={counts.player} accent="bg-amber-300" />
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={muted ? t("slingpuck_sound_on") : t("slingpuck_sound_off")}
            aria-pressed={!muted}
            className="pointer-events-auto rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] text-amber-100/70 shadow-lg backdrop-blur-md transition hover:border-amber-200/40 hover:text-amber-100"
          >
            {muted ? t("slingpuck_sound_on") : t("slingpuck_sound_off")}
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        {!freeMode && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-amber-100/45">
            {side === "player" ? t("slingpuck_your_turn") : t("slingpuck_ai_turn")}
          </span>
        )}
        <div className={`h-1.5 w-32 overflow-hidden rounded-full bg-white/10 transition-opacity ${dragging ? "opacity-100" : "opacity-0"}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-200 to-orange-400 transition-[width] duration-75"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, power)) * 100)}%` }}
          />
        </div>
        <span className={`text-[10px] tabular-nums text-amber-100/55 transition-opacity ${dragging ? "opacity-100" : "opacity-0"}`}>
          {t("slingpuck_power")} {Math.round(Math.min(1, Math.max(0, power)) * 100)}%
        </span>
      </div>
    </div>
  );
}
