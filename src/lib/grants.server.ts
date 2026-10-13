import { getSql } from "@/lib/db";
import { deliverableEmail } from "@/lib/mail.server";

export interface GrantRow {
  id: number;
  name: string;
  email: string;
  work: string;
  status: "pending" | "approved" | "declined";
  code: string | null;
  createdAt: string;
}

function stamp(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString();
}

function asStatus(value: string): GrantRow["status"] {
  if (value === "approved" || value === "declined") return value;
  return "pending";
}

export async function saveGrant(input: { name: string; email: string; work: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = deliverableEmail(input.email);
  if (!email) return { ok: false, error: "Use a real email." };
  const sql = await getSql();
  const open = await sql<{ id: number }>`
    select id from grant_applications where email = ${email} and status = 'pending' limit 1
  `;
  if (open.length > 0) return { ok: false, error: "That email already has an application in." };
  await sql`
    insert into grant_applications (name, email, work)
    values (${input.name}, ${email}, ${input.work})
  `;
  return { ok: true };
}

export async function listGrants(): Promise<GrantRow[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: number | string;
    name: string;
    email: string;
    work: string;
    status: string;
    code: string | null;
    created_at: unknown;
  }>`
    select id, name, email, work, status, code, created_at
    from grant_applications
    order by case when status = 'pending' then 0 else 1 end, created_at desc
    limit 200
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    email: row.email,
    work: row.work,
    status: asStatus(row.status),
    code: row.code,
    createdAt: stamp(row.created_at),
  }));
}

export async function approveGrant(id: number): Promise<{ code: string; emailed: boolean }> {
  const { createInvites } = await import("@/lib/invites.server");
  const sql = await getSql();
  const rows = await sql<{ name: string; email: string }>`
    select name, email from grant_applications where id = ${id} and status = 'pending'
  `;
  const row = rows[0];
  if (!row) throw new Error("That application is already decided.");
  const [invite] = await createInvites({
    percent: 100,
    ticket: "deposit",
    label: `Grant: ${row.name}`.slice(0, 80),
    count: 1,
  });
  const saved = await sql<{ id: number }>`
    update grant_applications
    set status = 'approved', code = ${invite.code}, decided_at = now()
    where id = ${id} and status = 'pending'
    returning id
  `;
  if (!saved[0]) {
    const { revokeInvite } = await import("@/lib/invites.server");
    await revokeInvite(invite.id);
    throw new Error("That application is already decided.");
  }
  const { sendGrantMail } = await import("@/lib/mail.server");
  const emailed = await sendGrantMail({ email: row.email, name: row.name, code: invite.code });
  return { code: invite.code, emailed };
}

export async function declineGrant(id: number): Promise<void> {
  const sql = await getSql();
  const saved = await sql<{ id: number }>`
    update grant_applications
    set status = 'declined', decided_at = now()
    where id = ${id} and status = 'pending'
    returning id
  `;
  if (!saved[0]) throw new Error("That application is already decided.");
}
