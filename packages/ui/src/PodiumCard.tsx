"use client";

import React from "react";
import { THEME, TYPOGRAPHY } from "@avclub/config";
import { LeaderboardEntry } from "@avclub/types";

export interface PodiumCardProps {
  place: 1 | 2 | 3;
  entry: LeaderboardEntry;
  className?: string;
}

export const PodiumCard: React.FC<PodiumCardProps> = ({
  place,
  entry,
  className = "",
}) => {
  const placeColor =
    place === 1
      ? THEME.colors.goldPodium
      : place === 2
      ? THEME.colors.silverPodium
      : THEME.colors.bronzePodium;

  const placeEmoji = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  const placeLabel = place === 1 ? "1ST PLACE" : place === 2 ? "2ND PLACE" : "3RD PLACE";

  return (
    <div
      className={`relative flex flex-col items-center justify-between rounded-2xl border-2 p-6 transition-all duration-500 hover:scale-105 ${className}`}
      style={{
        backgroundColor: THEME.colors.surfaceElevated,
        borderColor: placeColor,
        boxShadow: `0 0 35px ${placeColor}40`,
        fontFamily: TYPOGRAPHY.FONT_FAMILY,
      }}
    >
      {/* Top Trophy Banner */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-4xl">{placeEmoji}</span>
        <div
          className="text-lg font-black uppercase tracking-wider"
          style={{ color: placeColor }}
        >
          {placeLabel}
        </div>
      </div>

      {/* Project Title & Team */}
      <div className="text-center my-3">
        <h3
          className="text-2xl font-extrabold uppercase tracking-tight text-white mb-1"
          style={{ fontFamily: TYPOGRAPHY.FONT_FAMILY }}
        >
          {entry.title}
        </h3>
        <div
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: THEME.colors.cyberCyan }}
        >
          TEAM: {entry.teamName}
        </div>
      </div>

      {/* Score Badge */}
      <div
        className="mt-4 flex items-center gap-3 px-4 py-1.5 rounded-full border text-xs font-mono font-bold"
        style={{
          borderColor: placeColor,
          backgroundColor: `${placeColor}15`,
          color: placeColor,
        }}
      >
        <span>POINTS: {entry.score}</span>
        <span>•</span>
        <span>VOTES: {entry.voteCount}</span>
      </div>

      {/* Decorative High-Tech Framing Brackets */}
      <div
        className="absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2"
        style={{ borderColor: placeColor }}
      />
      <div
        className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2"
        style={{ borderColor: placeColor }}
      />
    </div>
  );
};
