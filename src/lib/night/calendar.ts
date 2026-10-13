import { AWARDS, EVENT, PHASES, TALKS, type PhaseId } from "@/lib/night/model";

export const CALENDAR_ID =
  "c09f6459d846de20efc513c002eae17137602d4c0175a295341c769dc93ce855@group.calendar.google.com";

export const CALENDAR_PAGE = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CALENDAR_ID)}&ctz=America%2FLos_Angeles`;

export const CALENDAR_ICS = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

/** The booked pilot. Parts of the night sit inside this window. */
export const PILOT = {
  y: 2026,
  m: 10,
  d: 16,
  startMinutes: 16 * 60,
  endMinutes: 19 * 60 + 15,
  place: "The Breakbeat, 112 W 2nd St, Chico, CA",
};

export interface WorkItem {
  title: string;
  team: string;
  blurb?: string;
}

export interface NightProgram {
  presented: WorkItem[];
  ranking: string[];
  attendees?: { name: string; ticket: string }[];
}

const LINKS = [
  `Calendar: ${CALENDAR_PAGE}`,
  "Club: https://github.com/maximusmaximus/AVCLUB",
].join("\n");

const ZONE = "America/Los_Angeles";

function wallToUtc(y: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = new Date(Date.UTC(y, month - 1, day, hour, minute));
  const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  const asZone = new Date(guess.toLocaleString("en-US", { timeZone: ZONE }));
  return new Date(guess.getTime() - (asZone.getTime() - asUtc.getTime()));
}

export function upcomingNightDate(): { y: number; m: number; d: number } {
  return { y: PILOT.y, m: PILOT.m, d: PILOT.d };
}

export function nightKey(): string {
  const { y, m, d } = upcomingNightDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function at(minutesFromStart: number): Date {
  const hour = Math.floor(PILOT.startMinutes / 60);
  const minute = PILOT.startMinutes % 60;
  const start = wallToUtc(PILOT.y, PILOT.m, PILOT.d, hour, minute);
  return new Date(start.getTime() + minutesFromStart * 60 * 1000);
}

function workLines(items: WorkItem[]): string {
  if (items.length === 0) return "Nothing submitted yet.";
  return items
    .map((item) => `- ${item.title} — ${item.team}${item.blurb ? `. ${item.blurb}` : ""}`)
    .join("\n");
}

export interface CalendarEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  url: string;
}

export function calendarEvents(program: NightProgram = { presented: [], ranking: [] }): CalendarEvent[] {
  const key = nightKey();
  const board = TALKS.map((talk) => ({ title: talk.title, team: talk.team, blurb: talk.blurb }));
  const folded = program.presented.length > 0 && program.ranking.length > 0;
  const shown = folded ? program.presented : board;
  const submitted = folded ? [] : program.presented;
  const ranking =
    program.ranking.length > 0 ? program.ranking.map((title, index) => `${index + 1}. ${title}`).join("\n") : "Not ranked yet.";
  const awards = AWARDS.map((award) => `${award.title}: ${award.talk} — ${award.team}. Judge ${award.judge}.`).join("\n");

  const door = 15;
  const timed = PHASES.filter((phase) => phase.id !== "CHECKIN" && phase.id !== "CONCLUDED");
  let cursor = door;
  const spans = new Map<PhaseId, { start: number; end: number }>();
  for (const phase of timed) {
    const minutes = phase.durationSec / 60;
    spans.set(phase.id, { start: cursor, end: cursor + minutes });
    cursor += minutes;
  }
  const close = PILOT.endMinutes - PILOT.startMinutes;

  const section = (id: PhaseId, extra: string, url = CALENDAR_PAGE): CalendarEvent => {
    const phase = PHASES.find((item) => item.id === id)!;
    const span = spans.get(id) ?? { start: 0, end: door };
    return {
      uid: `avclub-${id.toLowerCase()}-${key}@avclub`,
      title: `AVCLUB — ${phase.title}`,
      start: at(span.start),
      end: at(span.end),
      url,
      description: [`${phase.title}. ${phase.blurb}`, "", extra, "", LINKS].join("\n"),
    };
  };

  return [
    {
      uid: `avclub-night-${key}@avclub`,
      title: "AVCLUB — Signal Room",
      start: at(0),
      end: at(close),
      url: CALENDAR_PAGE,
      description: [
        "Share Ideas and Build.",
        `${PILOT.place}. Doors 4:00 PM. Check-in runs until 4:15. The clock starts then.`,
        [EVENT.sponsor, EVENT.judge ? `Judge ${EVENT.judge}.` : ""].filter(Boolean).join(" "),
        "Entry is $20. 18+.",
        program.attendees && program.attendees.length > 0
          ? ["", "In the room:", ...program.attendees.map((person) => `- ${person.name} — ${person.ticket}`)].join("\n")
          : "",
        "",
        LINKS,
      ].join("\n"),
    },
    {
      uid: `avclub-checkin-${key}@avclub`,
      title: "AVCLUB — Check-in",
      start: at(0),
      end: at(door),
      url: CALENDAR_PAGE,
      description: [
        "Check-in. Stewards at the door. Photo consent happens here. 18+.",
        "Arrive before the clock starts if you are building. After the first ten minutes you can come in, and you cannot build.",
        "",
        LINKS,
      ].join("\n"),
    },
    section("MEET_GREET", "Teams find each other. No presentations yet."),
    section("SPONSOR_TIME", [EVENT.sponsor, EVENT.sponsorLine, EVENT.judge ? `The judge is ${EVENT.judge}.` : "The judge is named."].filter(Boolean).join(" ")),
    section(
      "SHOW_TELL",
      [
        "Lightning presentations. This is the list of what gets shared.",
        "",
        `${folded ? "Presented" : "On the board"}:`,
        workLines(shown),
        ...(submitted.length > 0 ? ["", "Submitted tonight:", workLines(submitted)] : []),
      ].join("\n"),
    ),
    section("BUILD", "Two hours. Make the work in the room."),
    section("INTERMISSION", "Ten minutes."),
    section("REVIEW", ["Walk the room and look at what got made.", "", folded ? "Reviewed:" : "On the board:", workLines(shown)].join("\n")),
    section("VOTE", "Three minutes. Rank the work. The room mirrors the order."),
    section("REVEAL", ["First, second, and third.", "", ranking].join("\n")),
    section("AWARDS", ["The judge speaks after the room has ranked the work.", awards ? "" : "No awards yet.", awards].filter(Boolean).join("\n")),
  ];
}

function stamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildCalendarIcs(program?: NightProgram): string {
  const events = calendarEvents(program);
  const now = stamp(new Date());
  const blocks = events.map((event) =>
    [
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(event.start)}`,
      `DTEND:${stamp(event.end)}`,
      `SUMMARY:${icsEscape(event.title)}`,
      `LOCATION:${icsEscape(PILOT.place)}`,
      `URL:${event.url}`,
      `DESCRIPTION:${icsEscape(event.description)}`,
      "END:VEVENT",
    ].join("\r\n"),
  );
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AVCLUB//Signal Room//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...blocks, "END:VCALENDAR"].join("\r\n");
}
