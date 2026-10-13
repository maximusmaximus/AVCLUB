export type PhaseId =
  | "CHECKIN"
  | "MEET_GREET"
  | "SPONSOR_TIME"
  | "SHOW_TELL"
  | "BUILD"
  | "INTERMISSION"
  | "REVIEW"
  | "VOTE"
  | "REVEAL"
  | "AWARDS"
  | "CONCLUDED";

export type TicketKind = "deposit" | "supporter" | "cosponsor";
export type PayWhen = "now" | "door";
export type PayMethod = "card" | "apple" | "google";
export type Pace = "demo" | "real";
export type Surface = "event" | "profile" | "join" | "phone" | "room" | "door" | "floor";

export interface Phase {
  id: PhaseId;
  title: string;
  emoji: string;
  durationSec: number;
  blurb: string;
}

export const PHASES: Phase[] = [
  {
    id: "CHECKIN",
    title: "Check-in",
    emoji: "🚪",
    durationSec: 0,
    blurb: "Stewards at the door. Codes expire. Photo consent happens here.",
  },
  {
    id: "MEET_GREET",
    title: "Meet and Greet",
    emoji: "👋",
    durationSec: 15 * 60,
    blurb: "The room meets. Teams find each other.",
  },
  {
    id: "SPONSOR_TIME",
    title: "Sponsor Time",
    emoji: "🎮",
    durationSec: 5 * 60,
    blurb: "The screen names the judge.",
  },
  {
    id: "SHOW_TELL",
    title: "Show and Tell",
    emoji: "⚡",
    durationSec: 15 * 60,
    blurb: "Lightning presentations. Tag the people who made it with you.",
  },
  {
    id: "BUILD",
    title: "Build",
    emoji: "🔨",
    durationSec: 2 * 60 * 60,
    blurb: "Two hours. Make the work in the room.",
  },
  {
    id: "INTERMISSION",
    title: "Intermission",
    emoji: "☕",
    durationSec: 10 * 60,
    blurb: "Ten minutes.",
  },
  {
    id: "REVIEW",
    title: "Review",
    emoji: "👀",
    durationSec: 5 * 60,
    blurb: "Walk the room. Look at what got made.",
  },
  {
    id: "VOTE",
    title: "Vote",
    emoji: "📲",
    durationSec: 3 * 60,
    blurb: "Three minutes. Drag the work into your order. The room mirrors it.",
  },
  {
    id: "REVEAL",
    title: "Reveal",
    emoji: "🎉",
    durationSec: 2 * 60,
    blurb: "First, second, and third on pedestals.",
  },
  {
    id: "AWARDS",
    title: "Award Time",
    emoji: "🏆",
    durationSec: 5 * 60,
    blurb: "The judge speaks after the room.",
  },
  {
    id: "CONCLUDED",
    title: "Concluded",
    emoji: "🏁",
    durationSec: 0,
    blurb: "The night is filed.",
  },
];

export const PHASE_ORDER: PhaseId[] = PHASES.map((p) => p.id);

export function phaseById(id: PhaseId): Phase {
  return PHASES.find((p) => p.id === id) ?? PHASES[0]!;
}

export function nextPhaseId(id: PhaseId): PhaseId | null {
  const i = PHASE_ORDER.indexOf(id);
  if (i < 0 || i >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[i + 1]!;
}

/** Demo clock: long phases shrink, the vote stays long enough to rank. */
const DEMO_MS: Partial<Record<PhaseId, number>> = {
  MEET_GREET: 45_000,
  SPONSOR_TIME: 20_000,
  SHOW_TELL: 40_000,
  BUILD: 70_000,
  INTERMISSION: 18_000,
  REVIEW: 20_000,
  VOTE: 90_000,
  REVEAL: 24_000,
  AWARDS: 28_000,
};

export function durationMs(id: PhaseId, pace: Pace): number {
  const real = phaseById(id).durationSec * 1000;
  if (pace === "real") return real;
  if (id === "CHECKIN" || id === "CONCLUDED") return 0;
  return DEMO_MS[id] ?? Math.min(real, 30_000);
}

export function formatRemain(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatScheduled(sec: number): string {
  if (sec <= 0) return "Open";
  if (sec % 3600 === 0) {
    const h = sec / 3600;
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  if (sec >= 60) return `${Math.round(sec / 60)} min`;
  return `${sec} sec`;
}

export interface TicketOption {
  id: TicketKind;
  name: string;
  price: string;
  amount: number;
  detail: string;
  note: string;
}

export const TICKETS: TicketOption[] = [
  {
    id: "deposit",
    name: "Full night",
    price: "$20",
    amount: 20,
    detail: "Entry",
    note: "Build, vote, and stay through the awards.",
  },
  {
    id: "supporter",
    name: "Supporter",
    price: "$50",
    amount: 50,
    detail: "Per month",
    note: "Follow the work. An email digest of projects, if you say yes.",
  },
  {
    id: "cosponsor",
    name: "Co-sponsor",
    price: "$200",
    amount: 200,
    detail: "Per month",
    note: "Stand behind the recurring night, not a single ad.",
  },
];

export interface Person {
  id: string;
  name: string;
  ticket: TicketKind;
  code: string;
  checkedIn: boolean;
  consent: boolean;
  canBuild: boolean;
  watchOnly: boolean;
  payWhen: PayWhen;
  payMethod: PayMethod | null;
  donation: number;
  digest: boolean | null;
  profilePublic: boolean;
  isYou: boolean;
  paid?: boolean;
  inviteCode?: string | null;
  doorCall?: "build" | "watch";
}

export interface Talk {
  id: string;
  title: string;
  team: string;
  blurb: string;
}

export interface Award {
  title: string;
  talk: string;
  team: string;
  judge: string;
}

export const EVENT = {
  name: "Signal Room",
  venue: "The Breakbeat",
  startsLabel: "Thu, Oct 16 · 4:00 PM",
  sponsor: "",
  sponsorLine: "",
  judge: "",
  pairingCode: "",
};

export const TALKS: Talk[] = [];

export const SEEDED_BALLOTS: string[][] = [];

export const INITIAL_BALLOT: string[] = [];

export const AWARDS: Award[] = [];

export function freshPeople(): Person[] {
  return [];
}

export function accessFor(phase: PhaseId, ticket: TicketKind): { canBuild: boolean; watchOnly: boolean } {
  if (ticket === "supporter" || ticket === "cosponsor") {
    return { canBuild: false, watchOnly: false };
  }
  if (phase === "CHECKIN" || phase === "MEET_GREET" || phase === "SPONSOR_TIME") {
    return { canBuild: true, watchOnly: false };
  }
  if (phase === "SHOW_TELL") return { canBuild: false, watchOnly: false };
  return { canBuild: false, watchOnly: true };
}

export function canSort(person: Person | null, phase: PhaseId): boolean {
  if (!person?.checkedIn) return false;
  return phase === "REVIEW" || phase === "VOTE";
}

export function canVote(person: Person | null, phase: PhaseId): boolean {
  if (!person || !person.checkedIn) return false;
  if (person.ticket === "supporter" || person.ticket === "cosponsor") return false;
  if (person.watchOnly) return false;
  return phase === "VOTE" || phase === "REVEAL" || phase === "AWARDS" || phase === "CONCLUDED";
}

export function makeCode(name: string, taken: Set<string>): string {
  const letters = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const base = (letters + "XXXX").slice(0, 4);
  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n++) {
    const code = `${base.slice(0, 3)}${n % 10}`;
    if (!taken.has(code)) return code;
  }
  return `X${Date.now() % 1000}`;
}

export function alignBallot(ballot: string[], talks: Talk[]): string[] {
  const ids = talks.map((t) => t.id);
  const kept = ballot.filter((id) => ids.includes(id));
  const missing = ids.filter((id) => !kept.includes(id));
  return [...kept, ...missing];
}

export interface ScoredTalk extends Talk {
  score: number;
  rank: number;
}

export function scoreTalks(talks: Talk[], ballots: string[][]): ScoredTalk[] {
  const n = talks.length;
  const scores = new Map<string, number>(talks.map((t) => [t.id, 0]));
  for (const raw of ballots) {
    const aligned = alignBallot(raw, talks);
    aligned.forEach((id, i) => {
      scores.set(id, (scores.get(id) ?? 0) + (n - i));
    });
  }
  const ranked = [...talks].sort((a, b) => {
    const d = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
    if (d !== 0) return d;
    return a.title.localeCompare(b.title);
  });
  return ranked.map((t, i) => ({ ...t, score: scores.get(t.id) ?? 0, rank: i + 1 }));
}

export function ticketLabel(id: TicketKind): string {
  return TICKETS.find((t) => t.id === id)?.name ?? id;
}
