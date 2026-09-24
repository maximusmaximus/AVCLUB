"use client";

import React, { useState, useEffect } from "react";
import { EventPhase, PHASE_CATALOG } from "@avclub/types";
import { THEME } from "@avclub/config";

const PHASES: EventPhase[] = [
  "CHECKIN",
  "MEET_GREET",
  "SPONSOR_TIME",
  "SHOW_TELL",
  "BUILD",
  "INTERMISSION",
  "REVIEW",
  "VOTE",
  "REVEAL",
  "AWARDS",
  "PARTY",
];

export default function AdminMobilePage() {
  const [currentPhase, setCurrentPhase] = useState<EventPhase>("BUILD");
  const [remainingSec, setRemainingSec] = useState(7200);
  const [isPaused, setIsPaused] = useState(false);
  const [version, setVersion] = useState(1);
  const [showOverrun, setShowOverrun] = useState(false);

  // Ticker countdown
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setShowOverrun(true);
        }
        return Math.max(-3600, prev - 1);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const triggerHaptic = (pattern: number | number[] = 25) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const handleAction = (action: string) => {
    triggerHaptic(20);
    setVersion((v) => v + 1);

    if (action === "PAUSE") setIsPaused(true);
    if (action === "RESUME") setIsPaused(false);
    if (action === "REWIND") {
      const meta = PHASE_CATALOG[currentPhase];
      setRemainingSec(meta?.defaultDurationSec || 0);
      setShowOverrun(false);
    }
    if (action === "EXTEND") {
      setRemainingSec((s) => s + 300);
      setShowOverrun(false);
    }
    if (action === "FORWARD") {
      const idx = PHASES.indexOf(currentPhase);
      if (idx < PHASES.length - 1) {
        const nextPhase = PHASES[idx + 1];
        setCurrentPhase(nextPhase);
        setRemainingSec(PHASE_CATALOG[nextPhase]?.defaultDurationSec || 0);
        setShowOverrun(false);
      }
    }
    if (action === "SKIP") {
      handleAction("FORWARD");
    }
  };

  const isOverrun = remainingSec <= 0;
  const absSec = Math.abs(remainingSec);
  const minutes = Math.floor(absSec / 60);
  const seconds = absSec % 60;
  const timeFormatted = `${isOverrun ? "-" : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col min-h-screen p-5 justify-between">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between pb-4 border-b border-cyberCyan/30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📱</span>
          <div>
            <h1 className="text-sm font-black uppercase text-white tracking-wider">
              Admin Floor Controller
            </h1>
            <div className="text-[10px] font-mono text-cyberCyan">
              OCC v{version} // SYNC: DUAL-ADMIN
            </div>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded bg-black/60 border border-signalGreen/40 text-[10px] font-mono text-signalGreen font-bold flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-signalGreen animate-ping" />
          <span>STAGE CONNECTED</span>
        </div>
      </header>

      {/* ── Current Phase & Giant Timer ── */}
      <main className="my-auto text-center py-6">
        <div className="text-4xl mb-2">{PHASE_CATALOG[currentPhase]?.emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
          {currentPhase}
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-1">
          {PHASE_CATALOG[currentPhase]?.title}
        </p>

        {/* Big Mobile Chronometer */}
        <div
          className={`text-6xl sm:text-7xl font-black font-mono tracking-tight my-6 select-none ${
            isOverrun ? "text-dangerRed animate-pulse" : "text-white"
          }`}
          style={{
            textShadow: `0 0 25px ${
              isOverrun ? "rgba(255,42,109,0.5)" : "rgba(0,240,255,0.3)"
            }`,
          }}
        >
          {timeFormatted}
        </div>

        {isOverrun && (
          <div className="text-xs font-mono font-bold text-dangerRed uppercase animate-bounce mb-4">
            ⚠️ PHASE OVERRUN IN PROGRESS
          </div>
        )}

        {/* Tactile Control Grid */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <button
            onClick={() => handleAction(isPaused ? "RESUME" : "PAUSE")}
            className="py-4 rounded-xl border-2 border-cyberCyan font-black uppercase text-xs text-cyberCyan active:scale-95 transition-transform bg-cyberCyan/10 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
            {isPaused ? "▶ Resume" : "⏸ Pause"}
          </button>

          <button
            onClick={() => handleAction("REWIND")}
            className="py-4 rounded-xl border-2 border-laserAmber font-black uppercase text-xs text-laserAmber active:scale-95 transition-transform bg-laserAmber/10 shadow-[0_0_15px_rgba(255,184,0,0.2)]"
          >
            ⏮ Rewind
          </button>

          <button
            onClick={() => handleAction("EXTEND")}
            className="py-4 rounded-xl border-2 border-signalGreen font-black uppercase text-xs text-signalGreen active:scale-95 transition-transform bg-signalGreen/10 shadow-[0_0_15px_rgba(0,255,136,0.2)]"
          >
            +5m Extend
          </button>

          <button
            onClick={() => handleAction("FORWARD")}
            className="py-4 rounded-xl bg-cyberCyan font-black uppercase text-xs text-obsidian active:scale-95 transition-transform shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            ⏭ Forward
          </button>
        </div>
      </main>

      {/* ── Overrun Action Modal ── */}
      {showOverrun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border-2 border-dangerRed bg-surface p-6 text-center space-y-4 shadow-[0_0_40px_rgba(255,42,109,0.35)]">
            <div className="text-2xl">🚨</div>
            <h3 className="text-lg font-black uppercase text-white">
              Overrun Notice
            </h3>
            <p className="text-xs text-gray-300">
              {currentPhase} duration has concluded. Advance or extend the room:
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleAction("EXTEND")}
                className="w-full py-3 rounded-lg bg-surfaceBorder text-white font-bold uppercase text-xs"
              >
                +5 Min Extend
              </button>
              <button
                onClick={() => handleAction("FORWARD")}
                className="w-full py-3 rounded-lg bg-cyberCyan text-obsidian font-black uppercase text-xs"
              >
                Cut Short & Advance
              </button>
              <button
                onClick={() => handleAction("SKIP")}
                className="w-full py-3 rounded-lg border border-dangerRed text-dangerRed font-bold uppercase text-xs"
              >
                Emergency Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Phase Carousel ── */}
      <footer className="pt-4 border-t border-surfaceBorder">
        <div className="text-[10px] font-mono text-gray-400 uppercase mb-2">
          QUICK JUMP PHASE:
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {PHASES.map((p) => (
            <button
              key={p}
              onClick={() => {
                triggerHaptic(15);
                setCurrentPhase(p);
                setRemainingSec(PHASE_CATALOG[p]?.defaultDurationSec || 0);
              }}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded whitespace-nowrap ${
                currentPhase === p
                  ? "bg-cyberCyan text-obsidian"
                  : "bg-surfaceBorder text-gray-400"
              }`}
            >
              {PHASE_CATALOG[p]?.emoji} {p}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
