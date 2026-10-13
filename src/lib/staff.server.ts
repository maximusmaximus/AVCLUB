import { getSql } from "@/lib/db";

const COOKIE = "avclub_staff";
const OWNER = "maxinfeld@gmail.com";

export function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export async function isAdminUser(user: { email: string | null } | null): Promise<boolean> {
  const email = normalizeEmail(user?.email);
  if (!email) return false;
  if (email === OWNER) return true;
  const sql = await getSql();
  const rows = await sql<{ email: string }>`
    select email from admin_emails where email = ${email} limit 1
  `;
  return rows.length > 0;
}

export async function currentStaff(): Promise<string | null> {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const user = await getSessionUser();
  const email = normalizeEmail(user?.email);
  if (!email || !(await isAdminUser(user))) return null;
  return email;
}

export interface SignupRow {
  email: string;
  signedUpAt: string;
}

export interface Desk {
  signedIn: boolean;
  username: string | null;
  account: string | null;
  owner: boolean;
  admins: string[];
  live: boolean;
  stripeOn: boolean;
  stripeLast4: string | null;
  signups: SignupRow[];
}

function stamp(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

async function cookieJar() {
  return import("@tanstack/react-start/server");
}

export async function readLive(): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ live: boolean }>`select live from site_settings where id = 1`;
  return rows[0]?.live === true;
}

async function stripeDesk(): Promise<{ on: boolean; last4: string | null }> {
  const { stripeKeyStatus } = await import("@/lib/pay.server");
  return stripeKeyStatus();
}

async function listSignups(): Promise<SignupRow[]> {
  const sql = await getSql();
  const rows = await sql<{ email: string; created_at: unknown }>`
    select email, created_at from interest_signups order by created_at desc
  `;
  return rows.map((row) => ({ email: row.email, signedUpAt: stamp(row.created_at) }));
}

export async function loadDesk(): Promise<Desk> {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const user = await getSessionUser();
  const account = normalizeEmail(user?.email) || null;
  const live = await readLive();
  const stripe = await stripeDesk();
  const empty = {
    signedIn: false,
    username: null,
    account,
    owner: false,
    admins: [] as string[],
    live,
    stripeOn: stripe.on,
    stripeLast4: stripe.last4,
    signups: [] as SignupRow[],
  };
  if (!(await isAdminUser(user)) || !account) return empty;
  return {
    signedIn: true,
    username: account,
    account,
    owner: account === OWNER,
    admins: await listAdminEmails(),
    live,
    stripeOn: stripe.on,
    stripeLast4: stripe.last4,
    signups: await listSignups(),
  };
}

export async function listAdminEmails(): Promise<string[]> {
  const sql = await getSql();
  const rows = await sql<{ email: string }>`select email from admin_emails order by created_at`;
  const emails = rows.map((row) => row.email);
  if (!emails.includes(OWNER)) emails.unshift(OWNER);
  return emails;
}

async function requireOwner() {
  const email = await currentStaff();
  if (email !== OWNER) throw new Error("Only the owner can change admins.");
}

export async function addAdmin(email: string): Promise<string[]> {
  await requireOwner();
  const next = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next) || next.length > 254) throw new Error("Use a Google account email.");
  const sql = await getSql();
  await sql`insert into admin_emails (email) values (${next}) on conflict (email) do nothing`;
  return listAdminEmails();
}

export async function removeAdmin(email: string): Promise<string[]> {
  await requireOwner();
  const next = normalizeEmail(email);
  if (next === OWNER) throw new Error("The owner stays an admin.");
  const sql = await getSql();
  await sql`delete from admin_emails where email = ${next}`;
  return listAdminEmails();
}

export async function logout(): Promise<void> {
  const { getCookie, deleteCookie } = await cookieJar();
  const token = getCookie(COOKIE);
  if (token) {
    const sql = await getSql();
    await sql`delete from staff_sessions where token = ${token}`;
  }
  deleteCookie(COOKIE, { path: "/" });
}

export async function updateLive(live: boolean): Promise<{ live: boolean }> {
  const username = await currentStaff();
  if (!username) throw new Error("Sign in first.");
  const sql = await getSql();
  await sql`update site_settings set live = ${live} where id = 1`;
  return { live };
}
