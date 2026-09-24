import { z } from "zod";

export const EventPhaseSchema = z.enum([
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
  "CONCLUDED",
]);

export type EventPhase = z.infer<typeof EventPhaseSchema>;

export interface PhaseMetadata {
  id: EventPhase;
  title: string;
  emoji: string;
  defaultDurationSec: number;
  description: string;
  isInteractive: boolean;
}

export const PHASE_CATALOG: Record<EventPhase, PhaseMetadata> = {
  CHECKIN: {
    id: "CHECKIN",
    title: "Check-in",
    emoji: "🚪",
    defaultDurationSec: 0,
    description: "Steward door check-in, ticket verification, and photo consent.",
    isInteractive: true,
  },
  MEET_GREET: {
    id: "MEET_GREET",
    title: "Meet and Greet",
    emoji: "👋",
    defaultDurationSec: 15 * 60,
    description: "The room meets, teams form, and introductions begin.",
    isInteractive: false,
  },
  SPONSOR_TIME: {
    id: "SPONSOR_TIME",
    title: "Sponsor Time",
    emoji: "🎮",
    defaultDurationSec: 5 * 60,
    description: "Sponsor presence on the cycle and announcement of judge awards.",
    isInteractive: false,
  },
  SHOW_TELL: {
    id: "SHOW_TELL",
    title: "Show and Tell",
    emoji: "⚡",
    defaultDurationSec: 15 * 60,
    description: "Lightning presentations where teams submit projects and tag teammates.",
    isInteractive: true,
  },
  BUILD: {
    id: "BUILD",
    title: "Build",
    emoji: "🔨",
    defaultDurationSec: 120 * 60,
    description: "Two-hour shared sprint to construct physical and digital AV works.",
    isInteractive: true,
  },
  INTERMISSION: {
    id: "INTERMISSION",
    title: "Intermission",
    emoji: "☕",
    defaultDurationSec: 10 * 60,
    description: "Ten-minute break. Centered countdown over sponsor media.",
    isInteractive: false,
  },
  REVIEW: {
    id: "REVIEW",
    title: "Review",
    emoji: "👀",
    defaultDurationSec: 5 * 60,
    description: "Walk-around showcase to inspect all completed AV projects.",
    isInteractive: false,
  },
  VOTE: {
    id: "VOTE",
    title: "Vote",
    emoji: "📲",
    defaultDurationSec: 3 * 60,
    description: "Three-minute drag-to-rank public vote on phones, mirrored on big screen.",
    isInteractive: true,
  },
  REVEAL: {
    id: "REVEAL",
    title: "Reveal",
    emoji: "🎉",
    defaultDurationSec: 2 * 60,
    description: "1st, 2nd, and 3rd place displayed on 3D pedestals with confetti celebration.",
    isInteractive: false,
  },
  AWARDS: {
    id: "AWARDS",
    title: "Award Time",
    emoji: "🏆",
    defaultDurationSec: 5 * 60,
    description: "Sponsor-delegated judge awards presentation.",
    isInteractive: false,
  },
  PARTY: {
    id: "PARTY",
    title: "Party Time",
    emoji: "🎈",
    defaultDurationSec: 180 * 60,
    description: "Club celebration forwarding the room to drawing.grok.me.",
    isInteractive: true,
  },
  CONCLUDED: {
    id: "CONCLUDED",
    title: "Concluded",
    emoji: "🏁",
    defaultDurationSec: 0,
    description: "Event finished. Deposit refunds automated.",
    isInteractive: false,
  },
};

export const AdminTransportActionSchema = z.enum([
  "START",
  "PAUSE",
  "RESUME",
  "FORWARD",
  "REWIND",
  "EXTEND",
  "CUT_SHORT",
  "SKIP",
]);

export type AdminTransportAction = z.infer<typeof AdminTransportActionSchema>;

export const RoomSyncPacketSchema = z.object({
  eventId: z.string().uuid(),
  serverEpochMs: z.number(),
  currentPhase: EventPhaseSchema,
  phaseStartedAtEpochMs: z.number().nullable(),
  phaseEndsAtEpochMs: z.number().nullable(),
  isPaused: z.boolean(),
  pausedRemainingMs: z.number(),
  version: z.number(),
  activeVotersCount: z.number().default(0),
  totalCheckedInCount: z.number().default(0),
});

export type RoomSyncPacket = z.infer<typeof RoomSyncPacketSchema>;
