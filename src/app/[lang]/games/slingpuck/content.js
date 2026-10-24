"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/app/i18n/client";
import { FREE_AI, PHYSICS, TURN_SECONDS } from "./core/constants";
import { MatchEngine } from "./core/engine";
import { LiveMatch } from "./core/live";
import { loadRapier } from "./core/physics";
import { clampDragPoint, countPucks, initialPucks, sideOfPuck } from "./core/rules";
import { chooseShot, seededRng } from "./core/ai";
import { SlingPuckScene } from "./render/scene";
import { SlingPuckAudio } from "./render/audio";
import { StartPanel } from "./components/StartPanel";
import { GameHud } from "./components/GameHud";
import { ResultPanel } from "./components/ResultPanel";
import { boardHeightClass } from "./ui/layout";
import { createFrameQueue } from "./ui/frame";

const INITIAL_COUNTS = { player: 5, opponent: 5 };
const AI_DELAY_MS = 600;

export default function SlingPuckGame() {
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const audioRef = useRef(null);
  const rapierRef = useRef(null);
  const engineRef = useRef(null);
  const busyRef = useRef(false);
  const dragRef = useRef(null);
  const deadlineRef = useRef(0);
  const turnTokenRef = useRef(0);
  const dragFrameRef = useRef(null);
  if (!dragFrameRef.current) {
    // Apply at most one drag visual per animation frame regardless of how many
    // pointer moves the mouse reports.
    dragFrameRef.current = createFrameQueue(drag => {
      sceneRef.current?.updateDrag({ ...drag, side: "player" });
      setPower(drag.power);
    });
  }

  const liveRef = useRef(null);
  const liveTokenRef = useRef(0);
  const liveFrameRef = useRef(null);
  const liveAccRef = useRef(0);
  const aiTimerRef = useRef(null);
  const aiTickRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  const [mode, setMode] = useState("loading");
  const [gameMode, setGameMode] = useState("turns");
  const [matchId, setMatchId] = useState(0);
  const [difficulty, setDifficulty] = useState("normal");
  const [counts, setCounts] = useState(INITIAL_COUNTS);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [power, setPower] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [turnState, setTurnState] = useState({ side: "player", number: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const winnerRef = useRef(winner);
  winnerRef.current = winner;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const gameModeRef = useRef(gameMode);
  gameModeRef.current = gameMode;

  const updateCounts = useCallback(pucks => {
    setCounts({
      player: countPucks(pucks, "player"),
      opponent: countPucks(pucks, "opponent"),
    });
  }, []);

  const beginTurn = useCallback((side, options = {}) => {
    const engine = engineRef.current;
    if (!engine) return;
    turnTokenRef.current += 1;
    deadlineRef.current = Date.now() + TURN_SECONDS * 1000;
    setTimeLeft(TURN_SECONDS);
    setTurnState({ side, number: engine.turn });
    setMessage(options.notice || (side === "player"
      ? tRef.current("slingpuck_your_turn")
      : tRef.current("slingpuck_thinking")));
    sceneRef.current?.setInteractiveSide(side);
  }, []);

  const fire = useCallback((side, puckId, dragPoint) => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (!engine || !scene || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    dragRef.current = null;
    setDragging(false);
    setPower(0);
    const token = turnTokenRef.current;
    const before = engine.pucks;

    let result;
    try {
      result = engine.shoot({ side, puckId, dragPoint });
    } catch (shootError) {
      busyRef.current = false;
      setBusy(false);
      scene.cancelDrag();
      return;
    }

    audioRef.current?.launch(result.shot.power);
    scene.setInteractiveSide(null);
    scene.playShot({
      startPucks: before,
      frames: result.frames,
      events: result.events,
      shot: result.shot,
      onDone: () => {
        if (token !== turnTokenRef.current) return;
        scene.syncPucks(result.pucks);
        updateCounts(result.pucks);
        busyRef.current = false;
        setBusy(false);
        if (result.winner) {
          setWinner(result.winner);
          setMode("result");
          audioRef.current?.win();
        } else {
          beginTurn(result.nextSide);
        }
      },
    });
  }, [beginTurn, updateCounts]);

  const startGame = useCallback(() => {
    const rapier = rapierRef.current;
    const scene = sceneRef.current;
    if (!rapier || !scene) return;
    audioRef.current?.unlock();
    scene.cancelPlayback();
    scene.setInteractiveSide(null);
    scene.cancelDrag();
    dragFrameRef.current?.clear();
    dragRef.current = null;
    liveTokenRef.current += 1;
    if (liveRef.current) {
      liveRef.current.thawAll();
      liveRef.current.free();
      liveRef.current = null;
    }
    setWinner(null);
    setMode("playing");
    busyRef.current = false;
    setBusy(false);
    setDragging(false);
    setPower(0);
    if (gameMode === "free") {
      const live = new LiveMatch(rapier);
      liveRef.current = live;
      liveAccRef.current = 0;
      liveTokenRef.current += 1;
      engineRef.current = null;
      scene.setLiveMode(true);
      scene.syncLive(live.pucks);
      updateCounts(live.pucks);
      setMatchId(id => id + 1);
      return;
    }
    scene.setLiveMode(false);
    const engine = new MatchEngine(rapier, { side: "player" });
    engineRef.current = engine;
    scene.syncPucks(engine.pucks);
    updateCounts(engine.pucks);
    beginTurn("player");
  }, [beginTurn, gameMode, updateCounts]);

  const goMenu = useCallback(() => {
    liveTokenRef.current += 1;
    liveRef.current?.thawAll();
    liveRef.current?.free();
    liveRef.current = null;
    engineRef.current = null;
    busyRef.current = false;
    setBusy(false);
    dragRef.current = null;
    setDragging(false);
    setPower(0);
    setWinner(null);
    setCounts(INITIAL_COUNTS);
    setTimeLeft(TURN_SECONDS);
    sceneRef.current?.cancelPlayback();
    sceneRef.current?.setInteractiveSide(null);
    sceneRef.current?.cancelDrag();
    sceneRef.current?.setLiveMode(false);
    sceneRef.current?.syncPucks(initialPucks());
    setMode("menu");
  }, []);

  const goMenuRef = useRef(goMenu);
  goMenuRef.current = goMenu;

  useEffect(() => {
    let cancelled = false;
    const audio = new SlingPuckAudio();
    audioRef.current = audio;
    audio.setMuted(false);

    try {
      if (canvasRef.current && containerRef.current) {
        sceneRef.current = new SlingPuckScene(canvasRef.current, containerRef.current, { audio });
      }
    } catch (sceneError) {
      setError(sceneError.message || "WebGL unavailable");
    }

    loadRapier()
      .then(rapier => {
        if (cancelled) return;
        rapierRef.current = rapier;
        setMode("menu");
      })
      .catch(loadError => {
        if (cancelled) return;
        setError(loadError.message || "Physics engine failed to load");
      });

    return () => {
      cancelled = true;
      dragFrameRef.current?.clear();
      sceneRef.current?.dispose();
      sceneRef.current = null;
      audio.dispose();
      audioRef.current = null;
      rapierRef.current = null;
      engineRef.current = null;
      liveTokenRef.current += 1;
      liveRef.current?.thawAll();
      liveRef.current?.free();
      liveRef.current = null;
    };
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    if (mode !== "playing") return undefined;
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine || engine.winner) return;
      const left = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setTimeLeft(left);
      if (left <= 0 && !busyRef.current) {
        dragRef.current = null;
        dragFrameRef.current?.clear();
        setDragging(false);
        setPower(0);
        sceneRef.current?.cancelDrag();
        const next = engine.passTurn("timeout");
        beginTurn(next.side, { notice: tRef.current("slingpuck_timeout") });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [mode, beginTurn]);

  useEffect(() => {
    if (mode !== "playing" || busy || winner || turnState.side !== "opponent") return undefined;
    const engine = engineRef.current;
    if (!engine) return undefined;
    const token = turnTokenRef.current;
    const seed = engine.turn * 7919 + 17;
    const timer = setTimeout(() => {
      if (token !== turnTokenRef.current || busyRef.current || modeRef.current !== "playing") return;
      const current = engineRef.current;
      if (!current || current.currentSide !== "opponent" || current.winner) return;
      const choice = chooseShot({
        rapier: rapierRef.current,
        pucks: current.pucks,
        side: "opponent",
        difficulty: difficultyRef.current,
        rng: seededRng(seed),
      });
      if (token !== turnTokenRef.current) return;
      if (choice.skip) {
        const next = current.passTurn();
        beginTurn(next.side);
        return;
      }
      fire("opponent", choice.puckId, choice.dragPoint);
    }, AI_DELAY_MS);
    return () => clearTimeout(timer);
  }, [mode, busy, winner, turnState.side, turnState.number, beginTurn, fire]);

  const finishLive = useCallback(side => {
    liveTokenRef.current += 1;
    if (liveFrameRef.current) cancelAnimationFrame(liveFrameRef.current);
    liveFrameRef.current = null;
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = null;
    dragFrameRef.current?.clear();
    if (dragRef.current?.live) liveRef.current?.setFrozen(dragRef.current.puckId, false);
    dragRef.current = null;
    setDragging(false);
    setPower(0);
    liveRef.current?.thawAll();
    sceneRef.current?.cancelDrag();
    setWinner(side);
    setMode("result");
    audioRef.current?.win();
  }, []);

  useEffect(() => {
    if (mode !== "playing" || gameMode !== "free") return undefined;
    const live = liveRef.current;
    const scene = sceneRef.current;
    if (!live || !scene) return undefined;
    const token = liveTokenRef.current;
    lastFrameTimeRef.current = 0;
    const stepMs = PHYSICS.fixedDt * 1000;
    scene.setLiveMode(true);

    const frame = now => {
      liveFrameRef.current = null;
      if (token !== liveTokenRef.current || modeRef.current !== "playing") return;
      if (lastFrameTimeRef.current) {
        const delta = Math.min(100, now - lastFrameTimeRef.current);
        liveAccRef.current += delta;
      }
      lastFrameTimeRef.current = now;
      const steps = Math.floor(liveAccRef.current / stepMs);
      if (steps > 0) {
        liveAccRef.current -= steps * stepMs;
        const result = live.step(steps);
        result.events.forEach(evt => audioRef.current?.impact(evt.strength, evt.type));
        scene.syncLive(result.pucks, { skipId: dragRef.current?.puckId });
        updateCounts(result.pucks);
        if (result.winner) {
          finishLive(result.winner);
          return;
        }
      }
      liveFrameRef.current = requestAnimationFrame(frame);
    };
    liveFrameRef.current = requestAnimationFrame(frame);

    return () => {
      if (liveFrameRef.current) cancelAnimationFrame(liveFrameRef.current);
      liveFrameRef.current = null;
      live.thawAll();
      scene.setLiveMode(false);
    };
  }, [mode, gameMode, matchId, updateCounts, finishLive]);

  useEffect(() => {
    if (mode !== "playing" || gameMode !== "free") return undefined;
    const token = liveTokenRef.current;
    let timer = null;
    const cadence = FREE_AI.cadenceMs[difficulty] ?? FREE_AI.cadenceMs.normal;

    const arm = (delay = cadence) => {
      timer = setTimeout(tick, delay);
      aiTimerRef.current = timer;
    };
    const tick = () => {
      aiTimerRef.current = null;
      if (token !== liveTokenRef.current || modeRef.current !== "playing") return;
      const live = liveRef.current;
      if (!live || live.winner) return;
      const tickStartedAt = Date.now();
      aiTickRef.current += 1;
      const choice = chooseShot({
        rapier: rapierRef.current,
        pucks: live.pucks,
        side: "opponent",
        difficulty,
        rng: seededRng(token * 7919 + aiTickRef.current),
        grabbable: puck => puck.speed < PHYSICS.settleSpeed,
        config: {
          candidates: FREE_AI.search.candidates[difficulty] ?? FREE_AI.search.candidates.normal,
          budgetMs: FREE_AI.search.budgetMs,
        },
      });
      if (token !== liveTokenRef.current) return;
      if (!choice.skip) {
        try {
          const shotResult = live.shoot({ side: "opponent", puckId: choice.puckId, dragPoint: choice.dragPoint });
          audioRef.current?.launch(shotResult.power);
        } catch {
          // The board moved between the snapshot and the shot; retry next tick.
        }
      }
      // Cadence is tick-to-tick: the search budget sits inside the interval.
      if (token === liveTokenRef.current && modeRef.current === "playing") {
        arm(Math.max(0, cadence - (Date.now() - tickStartedAt)));
      }
    };
    arm();

    return () => {
      if (timer) clearTimeout(timer);
      if (aiTimerRef.current === timer) aiTimerRef.current = null;
    };
  }, [mode, gameMode, matchId, difficulty]);

  const grabLivePuck = useCallback(event => {
    const live = liveRef.current;
    const scene = sceneRef.current;
    if (!live || !scene || dragRef.current) return;
    audioRef.current?.unlock();
    const hit = scene.pickPuck(event.clientX, event.clientY);
    if (!hit) return;
    const puck = live.pucks.find(item => item.id === hit.id);
    if (!puck || sideOfPuck(puck) !== "player") return;
    if (live.puckSpeed(hit.id) >= PHYSICS.settleSpeed) return;

    live.setFrozen(hit.id, true);
    dragRef.current = {
      puckId: hit.id,
      start: { x: puck.x, y: puck.y },
      point: { x: puck.x, y: puck.y },
      pending: null,
      pointerId: event.pointerId,
      live: true,
    };
    scene.beginDrag(hit.id);
    setDragging(true);
    setPower(0);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; touch input still works without it.
    }
    event.preventDefault();
  }, []);

  const fireLive = useCallback(drag => {
    const live = liveRef.current;
    const scene = sceneRef.current;
    if (!live || !scene) return;
    const puck = live.pucks.find(item => item.id === drag.puckId);
    if (!puck || puck.y >= 0) {
      // Knocked across the divider mid-drag: the shot would come from the
      // opponent's half, so cancel instead.
      live.setFrozen(drag.puckId, false);
      scene.cancelDrag();
      return;
    }
    const clamped = drag.pending ? clampDragPoint(drag.start, drag.pending, "player") : null;
    if (!clamped || clamped.pull < PHYSICS.minPull) {
      live.setFrozen(drag.puckId, false);
      scene.cancelDrag();
      return;
    }
    live.setFrozen(drag.puckId, false);
    scene.cancelDrag();
    let shotResult;
    try {
      shotResult = live.shoot({ side: "player", puckId: drag.puckId, dragPoint: { x: clamped.x, y: clamped.y } });
    } catch (shootError) {
      return;
    }
    audioRef.current?.launch(shotResult.power);
  }, []);

  const handlePointerDown = useCallback(event => {
    if (gameModeRef.current === "free") {
      if (modeRef.current !== "playing" || !liveRef.current) return;
      grabLivePuck(event);
      return;
    }
    const engine = engineRef.current;
    const scene = sceneRef.current;
    if (modeRef.current !== "playing" || busyRef.current || !engine || !scene) return;
    if (engine.currentSide !== "player" || engine.winner) return;

    audioRef.current?.unlock();
    const hit = scene.pickPuck(event.clientX, event.clientY);
    if (!hit) return;
    const puck = engine.pucks.find(item => item.id === hit.id);
    if (!puck || sideOfPuck(puck) !== "player") return;

    dragRef.current = {
      puckId: hit.id,
      start: { x: puck.x, y: puck.y },
      point: { x: puck.x, y: puck.y },
      // Nothing pullable until a pointer move has been mapped; a release after
      // an unmappable move must not launch the previous position.
      pending: null,
      pointerId: event.pointerId,
    };
    scene.beginDrag(hit.id);
    setDragging(true);
    setPower(0);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; touch input still works without it.
    }
    event.preventDefault();
  }, [grabLivePuck]);

  const handlePointerMove = useCallback(event => {
    const drag = dragRef.current;
    const scene = sceneRef.current;
    if (!drag || !scene) return;
    if (drag.pointerId != null && event.pointerId != null && drag.pointerId !== event.pointerId) return;
    const board = scene.boardPoint(event.clientX, event.clientY);
    if (!board) {
      drag.pending = null;
      return;
    }
    const clamped = clampDragPoint(drag.start, board, "player");
    drag.point = { x: clamped.x, y: clamped.y };
    drag.pending = { x: clamped.x, y: clamped.y };
    dragFrameRef.current.push({
      puckId: drag.puckId,
      start: drag.start,
      dragPoint: drag.point,
      power: clamped.power,
    });
    event.preventDefault();
  }, []);

  const finishDrag = useCallback((event, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.pointerId != null && event.pointerId != null && drag.pointerId !== event.pointerId) return;
    if (drag.live) {
      dragRef.current = null;
      dragFrameRef.current?.clear();
      setDragging(false);
      setPower(0);
      try {
        event.currentTarget.releasePointerCapture?.(drag.pointerId);
      } catch {
        // Capture may already be released; nothing to do.
      }
      if (cancelled) {
        liveRef.current?.setFrozen(drag.puckId, false);
        sceneRef.current?.cancelDrag();
        return;
      }
      fireLive(drag);
      return;
    }
    dragRef.current = null;
    dragFrameRef.current?.clear();
    setDragging(false);
    setPower(0);
    try {
      event.currentTarget.releasePointerCapture?.(drag.pointerId);
    } catch {
      // Capture may already be released; nothing to do.
    }
    if (cancelled) {
      sceneRef.current?.cancelDrag();
      return;
    }
    const clamped = drag.pending ? clampDragPoint(drag.start, drag.pending, "player") : null;
    if (clamped && clamped.pull >= PHYSICS.minPull) {
      fire("player", drag.puckId, { x: clamped.x, y: clamped.y });
    } else {
      sceneRef.current?.cancelDrag();
    }
  }, [fire, fireLive]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || typeof window === "undefined") return undefined;
    const hook = {
      getScreenPoint: id => sceneRef.current?.getPuckScreenPoint(id) ?? null,
      getBoardScreenPoint: (x, y) => sceneRef.current?.getBoardScreenPoint(x, y) ?? null,
      canvasRect: () => canvasRef.current?.getBoundingClientRect() ?? null,
      sceneSize: () => sceneRef.current?.getSize() ?? null,
      hint: (side = "player") => {
        const engine = engineRef.current;
        const live = liveRef.current;
        const scene = sceneRef.current;
        const rapier = rapierRef.current;
        if ((!engine && !live) || !scene || !rapier) return null;
        const pucks = live ? live.pucks : engine.pucks;
        const choice = chooseShot({
          rapier,
          pucks,
          side,
          difficulty: "hard",
          rng: seededRng(live ? live.frame + 11 : engine.turn * 37 + 11),
          ...(live ? {
            grabbable: puck => puck.speed < PHYSICS.settleSpeed,
            config: {
              candidates: FREE_AI.search.candidates.hard,
              budgetMs: FREE_AI.search.budgetMs,
            },
          } : {}),
        });
        if (choice.skip) return { skip: true };
        const puck = pucks.find(item => item.id === choice.puckId);
        return {
          puckId: choice.puckId,
          side,
          start: { x: puck.x, y: puck.y },
          dragPoint: { ...choice.dragPoint },
          power: choice.power,
          direction: { ...choice.direction },
          startScreen: scene.getPuckScreenPoint(choice.puckId),
          dragScreen: scene.getBoardScreenPoint(choice.dragPoint.x, choice.dragPoint.y),
        };
      },
      state: () => {
        if (liveRef.current) {
          const pucks = liveRef.current.pucks;
          return {
            mode: modeRef.current,
            gameMode: "free",
            side: null,
            winner: liveRef.current.winner ?? null,
            turn: 0,
            busy: false,
            counts: { player: countPucks(pucks, "player"), opponent: countPucks(pucks, "opponent") },
            pucks,
          };
        }
        const engine = engineRef.current;
        const pucks = engine?.pucks ?? [];
        return {
          mode: modeRef.current,
          side: engine?.currentSide ?? null,
          winner: winnerRef.current,
          turn: engine?.turn ?? 0,
          busy: busyRef.current,
          counts: { player: countPucks(pucks, "player"), opponent: countPucks(pucks, "opponent") },
          pucks,
        };
      },
      setPlaybackRate: rate => sceneRef.current?.setPlaybackRate(rate),
      setGameMode: next => setGameMode(next),
      autoShot: side => {
        const live = liveRef.current;
        const rapier = rapierRef.current;
        if (!live || !rapier) return null;
        const choice = chooseShot({
          rapier,
          pucks: live.pucks,
          side,
          difficulty: "hard",
          grabbable: puck => puck.speed < PHYSICS.settleSpeed,
          config: {
            candidates: FREE_AI.search.candidates.hard,
            budgetMs: FREE_AI.search.budgetMs,
          },
        });
        if (choice.skip) return { skip: true };
        const shotResult = live.shoot({ side, puckId: choice.puckId, dragPoint: choice.dragPoint });
        audioRef.current?.launch(shotResult.power);
        return shotResult;
      },
      gameMode: () => gameModeRef.current,
      startFree: () => startGameRef.current(),
      busy: () => busyRef.current,
      backToMenu: () => goMenuRef.current(),
    };
    window.__slingPuck = hook;
    return () => {
      if (window.__slingPuck === hook) delete window.__slingPuck;
    };
  }, []);

  const startGameRef = useRef(startGame);
  startGameRef.current = startGame;

  const toggleSound = useCallback(() => {
    audioRef.current?.unlock();
    setMuted(value => !value);
  }, []);

  return (
    <section className="mx-auto w-full max-w-3xl px-3 pb-10 pt-2 sm:px-4">
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden rounded-[1.75rem] border border-amber-200/20 bg-[#101214] shadow-[0_30px_90px_rgba(0,0,0,0.45)] ${boardHeightClass()}`}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none select-none"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={event => finishDrag(event, false)}
          onPointerCancel={event => finishDrag(event, true)}
        />

        {mode === "playing" && (
          <GameHud
            gameMode={gameMode}
            side={turnState.side}
            counts={counts}
            timeLeft={timeLeft}
            power={power}
            dragging={dragging}
            message={message}
            muted={muted}
            onToggleSound={toggleSound}
            t={t}
          />
        )}

        {(mode === "menu" || mode === "loading") && !error && (
          <StartPanel
            gameMode={gameMode}
            onGameMode={setGameMode}
            difficulty={difficulty}
            onDifficulty={setDifficulty}
            onStart={startGame}
            disabled={mode === "loading"}
            t={t}
          />
        )}

        {mode === "result" && (
          <ResultPanel winner={winner} onRestart={startGame} onMenu={goMenu} t={t} />
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-6 text-center text-sm text-rose-100">
            {error}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
        {t(gameMode === "free" ? "slingpuck_free_hint" : "slingpuck_hint")}
      </p>
    </section>
  );
}
