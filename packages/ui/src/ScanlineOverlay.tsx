"use client";

import React from "react";

export interface ScanlineOverlayProps {
  opacity?: number;
  enableFlicker?: boolean;
}

export const ScanlineOverlay: React.FC<ScanlineOverlayProps> = ({
  opacity = 0.08,
  enableFlicker = false,
}) => {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 overflow-hidden ${
        enableFlicker ? "animate-pulse" : ""
      }`}
      style={{ opacity }}
    >
      {/* Scanline horizontal grid */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
      {/* CRT Vignette Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 65%, rgba(0, 0, 0, 0.6) 100%)",
        }}
      />
    </div>
  );
};
