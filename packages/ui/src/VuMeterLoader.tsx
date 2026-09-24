"use client";

import React, { useEffect, useState } from "react";
import { THEME, TYPOGRAPHY } from "@avclub/config";

export interface VuMeterLoaderProps {
  label?: string;
  sublabel?: string;
  bandsCount?: number;
  className?: string;
}

export const VuMeterLoader: React.FC<VuMeterLoaderProps> = ({
  label = "SYSTEM ENGAGED // LOADING TRANSIENTS",
  sublabel = "INITIALIZING AV PIPELINE...",
  bandsCount = 16,
  className = "",
}) => {
  const [bandHeights, setBandHeights] = useState<number[]>(() =>
    Array.from({ length: bandsCount }, () => Math.random() * 80 + 20)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setBandHeights(
        Array.from({ length: bandsCount }, () => Math.random() * 85 + 15)
      );
    }, 75);
    return () => clearInterval(interval);
  }, [bandsCount]);

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 rounded-xl border bg-black/80 backdrop-blur-md ${className}`}
      style={{
        borderColor: THEME.colors.surfaceBorder,
        boxShadow: "0 0 30px rgba(0, 240, 255, 0.1)",
        fontFamily: TYPOGRAPHY.FONT_FAMILY,
      }}
    >
      {/* 16-Segment Real-time VU-Meter Frequency Display */}
      <div className="flex items-end gap-1.5 h-24 mb-6 px-4">
        {bandHeights.map((height, i) => {
          const isHigh = height > 75;
          const isMid = height > 45;
          const barColor = isHigh
            ? THEME.colors.dangerRed
            : isMid
            ? THEME.colors.laserAmber
            : THEME.colors.cyberCyan;

          return (
            <div
              key={i}
              className="w-2.5 rounded-t-sm transition-all duration-75"
              style={{
                height: `${height}%`,
                backgroundColor: barColor,
                boxShadow: `0 0 10px ${barColor}`,
              }}
            />
          );
        })}
      </div>

      {/* Cyberpunk Text Decryption HUD */}
      <div className="text-center">
        <div
          className="text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2"
          style={{ color: THEME.colors.cyberCyan }}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{label}</span>
        </div>
        <div
          className="mt-1 text-xs font-mono tracking-wider"
          style={{ color: THEME.colors.textSecondary }}
        >
          {sublabel}
        </div>
      </div>
    </div>
  );
};
