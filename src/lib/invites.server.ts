import { getSql } from "@/lib/db";
import type { InviteTicket } from "@/lib/invites";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface InviteRow {
  id: number;
  code: string;
  percent: number;
  ticket: InviteTicket;
  label: string;
  usedName: string | null;
  usedTicket: string | null;
  usedAt: string | null;
}

function asTicket(value: string): InviteTicket {
  if (value === "deposit" || value === "party" || value === "night") return value;
  return "night";
}

function mapRow(row: {
  id: number | string;
  code: string;
  percent: number | string;
  ticket: string;
  label: string;
  used_name: string | null;
  used_ticket: string | null;
  used_at: string | Date | null;
}): InviteRow {
  return {
    id: Number(row.id),
    code: row.code,
    percent: Number(row.percent),
    ticket: asTicket(row.ticket),
    label: row.label,
    usedName: row.used_name,
    usedTicket: row.used_ticket,
    usedAt: row.used_at ? new Date(row.used_at).toISOString() : null,
  };
}

function makeCode(): string {
  let body = "";
  for (let i = 0; i < 4; i += 1) body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `AV-${body}`;
}

export async function listInvites(): Promise<InviteRow[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: number;
    code: string;
    percent: number;
    ticket: string;
    label: string;
    used_name: string | null;
    used_ticket: string | null;
    used_at: string | null;
  }>`
    select id, code, percent, ticket, label, used_name, used_ticket, used_at
    from invite_codes
    order by created_at desc
    limit 100
  `;
  return rows.map(mapRow);
}

export async function createInvites(input: {
  percent: number;
  ticket: InviteTicket;
  label: string;
  count: number;
}): Promise<InviteRow[]> {
  const sql = await getSql();
  const made: InviteRow[] = [];
  for (let n = 0; n < input.count; n += 1) {
    let saved: InviteRow | null = null;
    for (let attempt = 0; attempt < 5 && !saved; attempt += 1) {
      const code = makeCode();
      const rows = await sql<{
        id: number;
        code: string;
        percent: number;
        ticket: string;
        label: string;
        used_name: string | null;
        used_ticket: string | null;
        used_at: string | null;
      }>`
        insert into invite_codes (code, percent, ticket, label)
        values (${code}, ${input.percent}, ${input.ticket}, ${input.label})
        on conflict (code) do nothing
        returning id, code, percent, ticket, label, used_name, used_ticket, used_at
      `;
      if (rows[0]) saved = mapRow(rows[0]);
    }
    if (!saved) throw new Error("Couldn't make a code. Try again.");
    made.push(saved);
  }
  return made;
}

export async function revokeInvite(id: number): Promise<void> {
  const sql = await getSql();
  await sql`delete from invite_codes where id = ${id} and used_at is null`;
}

export async function lookupInvite(code: string): Promise<InviteRow | null> {
  const sql = await getSql();
  const rows = await sql<{
    id: number;
    code: string;
    percent: number;
    ticket: string;
    label: string;
    used_name: string | null;
    used_ticket: string | null;
    used_at: string | null;
  }>`
    select id, code, percent, ticket, label, used_name, used_ticket, used_at
    from invite_codes
    where code = ${code}
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function redeemInvite(code: string, ticket: string, name: string): Promise<InviteRow | null> {
  const sql = await getSql();
  const rows = await sql<{
    id: number;
    code: string;
    percent: number;
    ticket: string;
    label: string;
    used_name: string | null;
    used_ticket: string | null;
    used_at: string | null;
  }>`
    update invite_codes
    set used_name = ${name}, used_ticket = ${ticket}, used_at = now()
    where code = ${code}
      and used_at is null
      and (ticket = 'night' or ticket = ${ticket})
    returning id, code, percent, ticket, label, used_name, used_ticket, used_at
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}
