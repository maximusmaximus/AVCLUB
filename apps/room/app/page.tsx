"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { EventPhase, PHASE_CATALOG, LeaderboardEntry } from "@avclub/types";
import { URLS } from "@avclub/config";
import {
  EventBanner,
  PhaseChronometer,
  VuMeterLoader,
  PodiumCard,
} from "@avclub/ui";

const MOCK_FINALISTS: LeaderboardEntry[] = [
  {
    presentationId: "p1",
    title: "Laser Harp & Neon Sub",
    teamName: "Frequency Lab",
    score: 84,
    rank: 1,
    voteCount: 32,
  },
  {
    presentationId: "p2",
    title: "CRT Phosphor Feedback Loop",
    teamName: "Cathode Ray Club",
    score: 71,
    rank: 2,
    voteCount: 28,
  },
  {
    presentationId: "p3",
    title: "Eurorack Fluid Visualizer",
    teamName: "Modular Flow",
    score: 59,
    rank: 3,
    voteCount: 24,
  },
];

export default function RoomScreenPage() {
  const [isPaired, setIsPaired] = useState(true);
  const [pairingCode, setPairingCode] = useState("AV-ROOM-2026");
  const [currentPhase, setCurrentPhase] = useState<EventPhase>("BUILD");
  const [remainingSeconds, setRemainingSeconds] = useState(7200);
  const [isPaused, setIsPaused] = useState(false);
  const [connected, setConnected] = useState(true);
  const [voterCount, setVoterCount] = useState(18);
  const confettiTriggered = useRef(false);

  // 1. Screen Wake Lock API
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        console.warn("Wake Lock request failed:", err);
      }
    };

    requestWakeLock();
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // 2. Auto-Hiding Cursor
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const onMouseMove = () => {
      document.body.classList.remove("idle");
      clearTimeout(timer);
      timer = setTimeout(() => {
        document.body.classList.add("idle");
      }, 2500);
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      clearTimeout(timer);
    };
  }, []);

  // 3. Stage Countdown Ticker
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1 && currentPhase === "PARTY") {
          window.location.href = URLS.PARTY_TIME_REDIRECT;
        }
        return Math.max(-3600, prev - 1);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, currentPhase]);

  // 4. Confetti on REVEAL phase
  useEffect(() => {
    if (currentPhase === "REVEAL" && !confettiTriggered.current) {
      confettiTriggered.current = true;
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#00F0FF", "#7000FF", "#FFD700", "#FF2A6D"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#00F0FF", "#FFD700"],
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#7000FF", "#FFD700"],
        });
      }, 1000);
    } else if (currentPhase !== "REVEAL") {
      confettiTriggered.current = false;
    }
  }, [currentPhase]);

  const switchPhase = (p: EventPhase) => {
    setCurrentPhase(p);
    const meta = PHASE_CATALOG[p];
    setRemainingSeconds(meta?.defaultDurationSec || 0);
  };

  if (!isPaired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-obsidian">
        <div className="max-w-md w-full border-2 border-cyberCyan/40 rounded-2xl p-8 bg-surface text-center shadow-[0_0_50px_rgba(0,240,255,0.15)]">
          <div className="text-4xl mb-4">📺</div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-2">
            Pair Stage Display
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            Enter the admin stage access code to bind this screen to the tonight's event cycle.
          </p>
          <input
            type="text"
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value)}
            className="w-full text-center text-xl font-mono tracking-widest uppercase bg-black border border-cyberCyan/50 rounded-lg py-3 px-4 text-cyberCyan mb-6 focus:outline-none focus:border-cyberCyan"
          />
          <button
            onClick={() => setIsPaired(true)}
            className="w-full py-3.5 rounded-lg bg-cyberCyan text-obsidian font-extrabold uppercase tracking-wider hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            Connect Room Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* ── Top Header Bar ── */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <EventBanner phase={currentPhase} className="w-full sm:w-auto flex-1 max-w-4xl" />

        {/* Stage Status Telemetry */}
        <div className="flex items-center gap-4 bg-surface/90 border border-cyberCyan/30 rounded-xl px-5 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connected ? "bg-signalGreen animate-pulse" : "bg-laserAmber"
              }`}
            />
            <span className={connected ? "text-signalGreen" : "text-laserAmber"}>
              {connected ? "STAGE SYNC: LIVE" : "AUTONOMOUS TICKER"}
            </span>
          </div>
          <span className="text-gray-600">|</span>
          <div className="text-xs font-mono text-gray-300">
            ROOM: <span className="text-cyberCyan font-bold">{pairingCode}</span>
          </div>
        </div>
      </header>

      {/* ── Main Dynamic Stage View ── */}
      <main className="my-8 flex-1 flex flex-col items-center justify-center z-10">
        {/* VIEW 1: BUILD PHASE */}
        {currentPhase === "BUILD" && (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
            <PhaseChronometer
              remainingSeconds={remainingSeconds}
              totalDurationSeconds={7200}
              isPaused={isPaused}
              phaseTitle="BUILD TIME"
              size="stage"
              className="w-full"
            />
            <VuMeterLoader
              label="AUDIO TRANSIENT SPECTRUM // ACTIVE BUILD SPRINT"
              sublabel="14 HARDWARE TEAMS LOGGED IN // SUB-BASS TRANSIENTS ACTIVE"
              className="w-full max-w-2xl"
            />
          </div>
        )}

        {/* VIEW 2: INTERMISSION */}
        {currentPhase === "INTERMISSION" && (
          <div className="flex flex-col items-center text-center gap-6 max-w-3xl">
            <div className="text-6xl select-none">☕</div>
            <h2 className="text-4xl font-extrabold uppercase tracking-tight text-white">
              Intermission
            </h2>
            <p className="text-gray-400 max-w-lg">
              Take a break, grab a drink, and check out our community sponsors.
            </p>
            <PhaseChronometer
              remainingSeconds={remainingSeconds}
              totalDurationSeconds={600}
              isPaused={isPaused}
              phaseTitle="INTERMISSION COUNTDOWN"
              size="stage"
              className="w-full"
            />
          </div>
        )}

        {/* VIEW 3: LIVE VOTE */}
        {currentPhase === "VOTE" && (
          <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
            <div className="text-center">
              <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white mb-2">
                📲 VOTE NOW ON YOUR PHONE
              </h2>
              <p className="text-cyberCyan font-mono text-sm tracking-widest uppercase">
                DRAG PRESENTATIONS INTO ORDER // LIVE BALLOTS: {voterCount}
              </p>
            </div>
            <PhaseChronometer
              remainingSeconds={remainingSeconds}
              totalDurationSeconds={180}
              isPaused={isPaused}
              phaseTitle="PUBLIC VOTE RUNNING"
              size="stage"
              className="w-full max-w-xl"
            />
          </div>
        )}

        {/* VIEW 4: REVEAL (1ST, 2ND, 3RD PODIUMS) */}
        {currentPhase === "REVEAL" && (
          <div className="w-full max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
                🏆 CROWD FAVORITES REVEAL 🏆
              </h2>
              <p className="text-cyberCyan font-mono tracking-widest text-sm uppercase mt-1">
                TOP RANKED WORKS // JUDGE AWARDS FOLLOW IN 5 MINUTES
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* 2nd Place */}
              <PodiumCard place={2} entry={MOCK_FINALISTS[1]} className="order-2 md:order-1" />
              {/* 1st Place */}
              <PodiumCard place={1} entry={MOCK_FINALISTS[0]} className="order-1 md:order-2 md:-translate-y-6" />
              {/* 3rd Place */}
              <PodiumCard place={3} entry={MOCK_FINALISTS[2]} className="order-3 md:order-3" />
            </div>
          </div>
        )}

        {/* VIEW 5: PARTY TIME */}
        {currentPhase === "PARTY" && (
          <div className="flex flex-col items-center text-center gap-6 max-w-3xl">
            <div className="text-7xl select-none animate-bounce">🎈</div>
            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-cyberCyan">
              PARTY TIME ACTIVATED
            </h2>
            <p className="text-gray-300 text-lg">
              Redirecting the room screen to <b>drawing.grok.me</b>...
            </p>
            <div className="mt-4 p-4 rounded-xl border border-cyberCyan/40 bg-black/60 font-mono text-sm">
              TAP OR SCAN TO JOIN: <span className="text-cyberCyan font-bold">https://drawing.grok.me</span>
            </div>
          </div>
        )}

        {/* VIEW 6: DEFAULT CYCLE VIEWS */}
        {!["BUILD", "INTERMISSION", "VOTE", "REVEAL", "PARTY"].includes(currentPhase) && (
          <div className="flex flex-col items-center text-center gap-6 max-w-2xl">
            <div className="text-6xl select-none">{PHASE_CATALOG[currentPhase]?.emoji}</div>
            <h2 className="text-4xl font-extrabold uppercase tracking-tight text-white">
              {PHASE_CATALOG[currentPhase]?.title}
            </h2>
            <p className="text-gray-400 text-base">{PHASE_CATALOG[currentPhase]?.description}</p>
            {remainingSeconds > 0 && (
              <PhaseChronometer
                remainingSeconds={remainingSeconds}
                phaseTitle={PHASE_CATALOG[currentPhase]?.title}
                size="compact"
              />
            )}
          </div>
        )}
      </main>

      {/* ── Stage Transport Dock (Admin / Demo Controller) ── */}
      <footer className="z-10 bg-surface/90 border border-cyberCyan/20 rounded-2xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-wider text-cyberCyan">
            STAGE TRANSPORT:
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-3 py-1 text-xs font-mono font-bold uppercase rounded border border-cyberCyan text-cyberCyan hover:bg-cyberCyan hover:text-obsidian transition-colors"
          >
            {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
          <button
            onClick={() => setRemainingSeconds((prev) => prev + 300)}
            className="px-3 py-1 text-xs font-mono font-bold uppercase rounded border border-laserAmber text-laserAmber hover:bg-laserAmber hover:text-obsidian transition-colors"
          >
            +5 MIN
          </button>
        </div>

        {/* Phase Quick-Jumper */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {(
            [
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
            ] as EventPhase[]
          ).map((p) => {
            const active = currentPhase === p;
            return (
              <button
                key={p}
                onClick={() => switchPhase(p)}
                className={`px-2.5 py-1 text-xs font-bold rounded uppercase whitespace-nowrap transition-all ${
                  active
                    ? "bg-cyberCyan text-obsidian shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                    : "bg-surfaceBorder text-gray-300 hover:bg-surfaceBorderActive"
                }`}
              >
                {PHASE_CATALOG[p]?.emoji} {p}
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
