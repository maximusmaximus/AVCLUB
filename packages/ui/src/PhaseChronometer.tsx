"use client";

import React from "react";
import { THEME, TYPOGRAPHY } from "@avclub/config";

export interface PhaseChronometerProps {
  remainingSeconds: number;
  totalDurationSeconds?: number;
  isPaused?: boolean;
  phaseTitle?: string;
  size?: "compact" | "stage";
  className?: string;
}

export const PhaseChronometer: React.FC<PhaseChronometerProps> = ({
  remainingSeconds,
  totalDurationSeconds = 0,
  isPaused = false,
  phaseTitle = "ACTIVE PHASE",
  size = "compact",
  className = "",
}) => {
  const isNegative = remainingSeconds < 0;
  const absSec = Math.abs(remainingSeconds);
  const minutes = Math.floor(absSec / 60);
  const seconds = absSec % 60;

  const timeFormatted = `${isNegative ? "-" : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const isStage = size === "stage";
  const isUrgent = remainingSeconds <= 60 && remainingSeconds > 0;
  const isOverrun = remainingSeconds <= 0 && totalDurationSeconds > 0;

  const timerColor = isOverrun
    ? THEME.colors.dangerRed
    : isUrgent
    ? THEME.colors.laserAmber
    : THEME.colors.cyberCyan;

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border p-6 transition-all duration-300 ${
        isOverrun ? "animate-pulse border-red-500" : ""
      } ${className}`}
      style={{
        backgroundColor: THEME.colors.surface,
        borderColor: timerColor,
        fontFamily: TYPOGRAPHY.FONT_FAMILY,
        boxShadow: `0 0 35px ${isOverrun ? "rgba(255, 42, 109, 0.3)" : "rgba(0, 240, 255, 0.15)"}`,
      }}
    >
      <div
        className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2"
        style={{ color: timerColor }}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isPaused ? "bg-amber-400" : "bg-cyan-400 animate-ping"
          }`}
        />
        <span>
          {isPaused ? "PAUSED // " : isOverrun ? "OVERRUN // " : ""}{phaseTitle}
        </span>
      </div>

      <div
        className={`font-extrabold tracking-tight select-none font-mono ${
          isStage ? "text-7xl sm:text-9xl" : "text-4xl sm:text-6xl"
        }`}
        style={{
          color: THEME.colors.textPrimary,
          textShadow: `0 0 25px ${timerColor}`,
        }}
      >
        {timeFormatted}
      </div>

      {isOverrun && (
        <div
          className="mt-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: THEME.colors.dangerRed }}
        >
          ⚠️ OVERRUN IN PROGRESS — ADMIN ACTION REQUIRED
        </div>
      )}
    </div>
  );
};
