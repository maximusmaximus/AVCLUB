export const THEME = {
  colors: {
    obsidian: "#07070A",
    surface: "#111118",
    surfaceElevated: "#181824",
    surfaceBorder: "#26263A",
    surfaceBorderActive: "#3E3E5E",
    
    // Brand High-Voltage Accents
    cyberCyan: "#00F0FF",
    neonPurple: "#7000FF",
    laserAmber: "#FFB800",
    signalGreen: "#00FF88",
    dangerRed: "#FF2A6D",
    
    // Text Hierarchy
    textPrimary: "#F0F0F5",
    textSecondary: "#A0A0B8",
    textMuted: "#606078",
    
    // Stage Lights
    goldPodium: "#FFD700",
    silverPodium: "#C0C0C0",
    bronzePodium: "#CD7F32",
  },
  animation: {
    springFast: { type: "spring", stiffness: 500, damping: 35 },
    springSnappy: { type: "spring", stiffness: 400, damping: 30 },
    springBouncy: { type: "spring", stiffness: 300, damping: 20 },
    durations: {
      scanlineWipeMs: 250,
      scrambleHeaderMs: 300,
      podiumRevealSec: 10,
    },
  },
} as const;
