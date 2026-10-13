import { getSql, type Sql } from "@/lib/db";
import { EVENT_SLUG } from "@/lib/access.server";
import { TICKETS, PHASES, phaseById, type PhaseId, type TicketKind } from "@/lib/night/model";
import { sectionForPhase } from "@/lib/night/sections";

const START = Date.parse("2026-10-16T16:00:00-07:00");
const END = Date.parse("2026-10-16T19:15:00-07:00");
const REMIND = START - 15 * 60 * 1000;
const LIVE_FROM = START - 20 * 60 * 1000;
const LIVE_UNTIL = END + 3 * 60 * 60 * 1000;

export type MailFlush = {
  sent: number;
  held: number;
  failed: number;
  reason: string | null;
};

export type MailStatus = {
  unsent: number;
  sent: number;
  lastError: string | null;
};

function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 80);
}

export function deliverableEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;
  if (email.endsWith("@viewer.grok.invalid") || email.endsWith(".local")) return null;
  return email;
}

function onNight(now: number) {
  return now >= LIVE_FROM && now <= LIVE_UNTIL;
}

async function enqueue(input: {
  kind: string;
  to: string;
  subject: string;
  body: string;
  dedupe: string;
}) {
  const sql = await getSql();
  await sql`
    insert into email_outbox (kind, to_email, subject, body, dedupe_key)
    values (${input.kind}, ${input.to}, ${input.subject}, ${input.body}, ${input.dedupe})
    on conflict (dedupe_key) do nothing
  `;
}

function held(message: string) {
  const text = message.toLowerCase();
  return (
    text.includes("connector") ||
    text.includes("login required") ||
    text.includes("access_denied") ||
    text.includes("gate host") ||
    text.includes("pending")
  );
}

async function deliver(row: { id: unknown; to_email: string; subject: string; body: string }) {
  const { callTool, ConnectorType } = await import("@/lib/app-data/client.server");
  const result = await callTool(
    "gmail_send_message",
    { to: [row.to_email], subject: row.subject, body: row.body },
    { connectorType: ConnectorType.Gmail },
  );
  const sql = await getSql();
  if (result.ok) {
    await sql`update email_outbox set sent_at = now(), last_error = null where id = ${row.id}`;
    return { status: "sent" as const };
  }
  const reason = (result.errorMessage ?? "Couldn't send.").slice(0, 240);
  await sql`update email_outbox set last_error = ${reason} where id = ${row.id} and sent_at is null`;
  if (result.pending || result.loginRequired || held(reason)) {
    return { status: "held" as const, reason };
  }
  return { status: "failed" as const, reason };
}

export async function flushMail(limit = 20): Promise<MailFlush> {
  const sql = await getSql();
  const rows = await sql<{ id: unknown; to_email: string; subject: string; body: string }>`
    select id, to_email, subject, body
    from email_outbox
    where sent_at is null
    order by id
    limit ${limit}
  `;
  let sent = 0;
  let heldCount = 0;
  let failed = 0;
  let reason: string | null = null;
  for (const row of rows) {
    const result = await deliver(row);
    if (result.status === "sent") sent += 1;
    else if (result.status === "held") {
      heldCount += 1;
      reason = result.reason;
      break;
    } else {
      failed += 1;
      reason = result.reason;
    }
  }
  return { sent, held: heldCount, failed, reason };
}

async function wasSent(dedupe: string) {
  const sql = await getSql();
  const rows = await sql<{ sent_at: string | null }>`
    select sent_at from email_outbox where dedupe_key = ${dedupe}
  `;
  return Boolean(rows[0]?.sent_at);
}

export async function sendInterestMail(email: string): Promise<boolean> {
  const to = deliverableEmail(email);
  if (!to) return false;
  const dedupe = `interest:${to}`;
  await enqueue({
    kind: "interest",
    to,
    dedupe,
    subject: "You're on the AVCLUB list",
    body: [
      "You're on the list for Audio Visual Club.",
      "",
      "We'll write when the next night is set.",
      "AVCLUB PILOT is Friday, October 16, 2026, 4:00–7:15 PM at The Breakbeat, Chico.",
      "",
      "Share ideas and build.",
    ].join("\n"),
  });
  await flushMail(8);
  return wasSent(dedupe);
}

export async function sendTicketMail(input: {
  email: string | null;
  name: string;
  code: string;
  ticket: TicketKind;
}): Promise<boolean> {
  const to = deliverableEmail(input.email);
  if (!to) return false;
  const name = oneLine(input.name) || "there";
  const code = oneLine(input.code).toUpperCase();
  const ticket = TICKETS.find((item) => item.id === input.ticket)?.name ?? "Guest";
  const dedupe = `ticket:${EVENT_SLUG}:${to}:${code}`;
  await enqueue({
    kind: "ticket",
    to,
    dedupe,
    subject: "Your AVCLUB PILOT code",
    body: [
      `${name}, you're registered for AVCLUB PILOT.`,
      "",
      "Friday, October 16, 2026",
      "4:00–7:15 PM",
      "The Breakbeat, Chico",
      "",
      `Door code: ${code}`,
      `Ticket: ${ticket}`,
      "",
      "Show this code at the door. You'll get it again 15 minutes before, and a short note as each part of the night starts.",
    ].join("\n"),
  });
  await flushMail(8);
  return wasSent(dedupe);
}

export async function sendGrantMail(input: { email: string; name: string; code: string }): Promise<boolean> {
  const to = deliverableEmail(input.email);
  if (!to) return false;
  const name = oneLine(input.name) || "there";
  const code = oneLine(input.code).toUpperCase();
  const dedupe = `grant:${EVENT_SLUG}:${to}:${code}`;
  await enqueue({
    kind: "grant",
    to,
    dedupe,
    subject: "Your AVCLUB grant ticket",
    body: [
      `${name}, you have a grant ticket for AVCLUB PILOT.`,
      "",
      "Use this Grant Code when you sign up. It covers the $20 entry.",
      "",
      code,
      "",
      "Friday, October 16, 2026",
      "4:00–7:15 PM",
      "The Breakbeat, Chico",
    ].join("\n"),
  });
  await flushMail(8);
  return wasSent(dedupe);
}

type Registrant = { email: string; code: string; name: string };

async function registrants(sql: Sql): Promise<Registrant[]> {
  const rows = await sql<{ email: string | null; code: string | null; name: string | null }>`
    select u.email as email, p.door_code as code,
      coalesce(nullif(pr.display_name, ''), nullif(u.name, ''), 'there') as name
    from participations p
    join "user" u on u.id = p.user_id
    left join profiles pr on pr.user_id = p.user_id
    where p.event_slug = ${EVENT_SLUG} and p.door_code is not null
  `;
  const seen = new Set<string>();
  const people: Registrant[] = [];
  for (const row of rows) {
    const email = deliverableEmail(row.email);
    const code = row.code?.trim();
    if (!email || !code || seen.has(email)) continue;
    seen.add(email);
    people.push({ email, code, name: oneLine(row.name ?? "") || "there" });
  }
  return people;
}

export async function syncNightMail(): Promise<MailFlush> {
  const now = Date.now();
  if (now >= REMIND && now < START) {
    const sql = await getSql();
    for (const person of await registrants(sql)) {
      await enqueue({
        kind: "reminder",
        to: person.email,
        dedupe: `remind:${EVENT_SLUG}:${person.email}`,
        subject: "AVCLUB PILOT in 15 minutes",
        body: [
          `${person.name}, the door opens at 4:00 PM.`,
          "",
          `Your code is ${person.code}.`,
          "Friday, October 16, 2026",
          "The Breakbeat, Chico",
          "The night runs until 7:15 PM.",
        ].join("\n"),
      });
    }
  }
  return flushMail(20);
}

export async function mailStatus(): Promise<MailStatus> {
  const sql = await getSql();
  const counts = await sql<{ unsent: number | string; sent: number | string }>`
    select
      count(*) filter (where sent_at is null) as unsent,
      count(*) filter (where sent_at is not null) as sent
    from email_outbox
  `;
  const errors = await sql<{ last_error: string | null }>`
    select last_error from email_outbox
    where sent_at is null and last_error is not null
    order by id desc
    limit 1
  `;
  return {
    unsent: Number(counts[0]?.unsent ?? 0),
    sent: Number(counts[0]?.sent ?? 0),
    lastError: errors[0]?.last_error ?? null,
  };
}

function knownPhase(value: string | null | undefined): PhaseId | null {
  if (!value) return null;
  return PHASES.some((phase) => phase.id === value) ? (value as PhaseId) : null;
}

export async function readLivePhase(): Promise<{ phase: PhaseId | null }> {
  const sql = await getSql();
  const rows = await sql<{ phase: string }>`
    select phase from night_phase where event_slug = ${EVENT_SLUG}
  `;
  return { phase: knownPhase(rows[0]?.phase) };
}

async function canAnnounce(userId: string | null) {
  const { currentStaff } = await import("@/lib/staff.server");
  if (await currentStaff()) return true;
  if (!userId) return false;
  const sql = await getSql();
  const rows = await sql<{ capability: string }>`
    select capability from access_grants
    where user_id = ${userId} and capability in ('floor', 'staff')
    limit 1
  `;
  return rows.length > 0;
}

export async function announceLivePhase(phase: PhaseId, userId: string | null, mount = false) {
  if (!(await canAnnounce(userId))) return { ok: false as const };
  if (!onNight(Date.now())) return { ok: true as const, live: false };
  const sql = await getSql();
  const current = await sql<{ phase: string }>`
    select phase from night_phase where event_slug = ${EVENT_SLUG}
  `;
  const previous = knownPhase(current[0]?.phase);
  if (mount && previous) return { ok: true as const, live: true };
  if (previous === phase) return { ok: true as const, live: true };
  await sql`
    insert into night_phase (event_slug, phase)
    values (${EVENT_SLUG}, ${phase})
    on conflict (event_slug) do update set phase = ${phase}, updated_at = now()
  `;
  if (phase === "CONCLUDED") return { ok: true as const, live: true };
  const section = sectionForPhase(phase);
  const title = phaseById(phase).title;
  const note = section?.action ?? phaseById(phase).blurb;
  for (const person of await registrants(sql)) {
    await enqueue({
      kind: "phase",
      to: person.email,
      dedupe: `phase:${EVENT_SLUG}:${phase}:${person.email}`,
      subject: `AVCLUB · ${title}`,
      body: [
        `${person.name}, ${title} is up.`,
        "",
        note,
        "The order can move if the floor runs ahead or holds.",
        section ? `Follow it: /e/${section.slug}` : "",
        "",
        `Your code is ${person.code}.`,
      ]
        .filter((line) => line !== "")
        .join("\n"),
    });
  }
  await flushMail(20);
  return { ok: true as const, live: true };
}
