import type { PhaseId } from "@/lib/night/model";

export interface Section {
  slug: string;
  phase: PhaseId;
  starts: string;
  action: string;
}

export const SECTIONS: Section[] = [
  { slug: "check-in", phase: "CHECKIN", starts: "4:00", action: "Show your code. The steward decides if you can build." },
  { slug: "meet-and-greet", phase: "MEET_GREET", starts: "4:15", action: "Find who you will build with." },
  { slug: "sponsor-time", phase: "SPONSOR_TIME", starts: "4:30", action: "Watch the screen. The judge is named." },
  { slug: "show-and-tell", phase: "SHOW_TELL", starts: "4:35", action: "Share what you scheduled. Only checked-in work is on the screen." },
  { slug: "build", phase: "BUILD", starts: "4:50", action: "Make the work. Two hours." },
  { slug: "intermission", phase: "INTERMISSION", starts: "6:50", action: "Ten minutes." },
  { slug: "review", phase: "REVIEW", starts: "7:00", action: "Everyone in the room sorts what was shown." },
  { slug: "vote", phase: "VOTE", starts: "7:05", action: "People's choice settles second and third." },
  { slug: "reveal", phase: "REVEAL", starts: "7:08", action: "The judge picks first. The room picks second and third." },
  { slug: "awards", phase: "AWARDS", starts: "7:10", action: "The judge speaks after the room." },
];

export function sectionBySlug(slug: string): Section | null {
  return SECTIONS.find((section) => section.slug === slug) ?? null;
}

export function sectionForPhase(phase: PhaseId): Section | null {
  return SECTIONS.find((section) => section.phase === phase) ?? null;
}
