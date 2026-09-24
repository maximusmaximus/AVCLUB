"use client";

import React from "react";
import { TYPOGRAPHY, THEME } from "@avclub/config";
import { EventPhase, PHASE_CATALOG } from "@avclub/types";

export interface EventBannerProps {
  phase: EventPhase;
  customSubtitle?: string;
  className?: string;
}

export const EventBanner: React.FC<EventBannerProps> = ({
  phase,
  customSubtitle,
  className = "",
}) => {
  const meta = PHASE_CATALOG[phase] || {
    emoji: "⚡",
    title: phase,
    description: "",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 p-6 transition-all duration-300 ${className}`}
      style={{
        backgroundColor: THEME.colors.surface,
        borderColor: THEME.colors.cyberCyan,
        fontFamily: TYPOGRAPHY.FONT_FAMILY,
        boxShadow: `0 0 25px rgba(0, 240, 255, 0.15)`,
      }}
    >
      {/* Brutalist Telemetry Header Tag */}
      <div
        className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase"
        style={{ color: THEME.colors.cyberCyan }}
      >
        <span>// AVCLUB LIVE CYCLE //</span>
        <span>•</span>
        <span>PHASE: {phase}</span>
      </div>

      {/* Main Title: Strictly Open Sans Bold + Emoji */}
      <div className="flex items-center gap-4">
        <span className="text-4xl sm:text-5xl select-none" role="img" aria-label={meta.title}>
          {meta.emoji}
        </span>
        <div>
          <h1
            className="text-2xl sm:text-4xl font-extrabold tracking-tight uppercase"
            style={{
              color: THEME.colors.textPrimary,
              fontFamily: TYPOGRAPHY.FONT_FAMILY,
            }}
          >
            {meta.title}
          </h1>
          <p
            className="mt-1 text-sm font-medium"
            style={{ color: THEME.colors.textSecondary }}
          >
            {customSubtitle || meta.description}
          </p>
        </div>
      </div>

      {/* High-Tech Framing Corner Reticles */}
      <div
        className="absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2"
        style={{ borderColor: THEME.colors.cyberCyan }}
      />
      <div
        className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2"
        style={{ borderColor: THEME.colors.cyberCyan }}
      />
    </div>
  );
};
