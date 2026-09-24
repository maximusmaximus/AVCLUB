/**
 * Locked Brand Typography Configuration:
 * "Every event banner — on the site, on the paired screen, on phones, on print —
 * strictly follows:
 * 1. Type is always a variation of Open Sans (Regular, Medium, SemiBold, Bold, ExtraBold, Condensed, Italic).
 * 2. Banners carry emoji.
 * Sponsor logos and videos sit *under* that type."
 */

export const TYPOGRAPHY = {
  FONT_FAMILY: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  GOOGLE_FONTS_URL: "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap",
  ALLOWED_WEIGHTS: [300, 400, 500, 600, 700, 800] as const,
  MONO_FALLBACK: "'Consolas', 'Courier New', monospace",
} as const;

export interface EventBannerSpec {
  phaseEmoji: string;
  phaseTitle: string;
  tagline: string;
  fontFamily: string;
  fontWeight: number;
  textColorHex: string;
  accentColorHex: string;
}

export const APPROVED_BANNER_EMOJIS = {
  CHECKIN: "🚪",
  MEET_GREET: "👋",
  SPONSOR_TIME: "🎮",
  SHOW_TELL: "⚡",
  BUILD: "🔨",
  INTERMISSION: "☕",
  REVIEW: "👀",
  VOTE: "📲",
  REVEAL: "🎉",
  AWARDS: "🏆",
  PARTY: "🎈",
  CONCLUDED: "🏁",
} as const;
