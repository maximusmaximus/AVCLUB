import { getSql } from "@/lib/db";
import type { TicketKind } from "@/lib/night/model";
import {
  CAPABILITIES,
  EVENT_LABEL,
  isBanner,
  isCapability,
  type AccessSnapshot,
  type Activity,
  type BannerId,
  type Capability,
  type ProfileView,
} from "@/lib/access-model";

export const EVENT_SLUG = "avclub-pilot";

const TICKET_COPY: Record<TicketKind, { participation: string; contribution: string; note: string; phone: boolean; room: boolean }> = {
  deposit: { participation: "Full night", contribution: "Builder", note: "Building the night.", phone: true, room: false },
  supporter: { participation: "Supporter", contribution: "Supporter", note: "Supporting the club.", phone: false, room: true },
  cosponsor: { participation: "Co-sponsor", contribution: "Co-sponsor", note: "Co-sponsoring the night.", phone: false, room: true },
};

const STAFF_ROLE = { door: "Door", room: "Room", floor: "Floor" } as const;

function seedUsername(email: string | null, userId: string): string {
  const local = email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  const stem = local.length >= 3 ? local.slice(0, 16) : `member${userId.replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase()}`;
  return stem.length >= 3 ? stem : "member";
}

async function grant(userId: string, capability: string) {
  const sql = await getSql();
  await sql`
    insert into access_grants (user_id, capability)
    values (${userId}, ${capability})
    on conflict (user_id, capability) do nothing
  `;
}

async function accountName(userId: string): Promise<string> {
  try {
    const sql = await getSql();
    const rows = await sql<{ name: string | null }>`select name from "user" where id = ${userId}`;
    return (rows[0]?.name ?? "").trim().replace(/\s+/g, " ").slice(0, 48);
  } catch {
    return "";
  }
}

export async function ensureProfile(userId: string, email: string | null) {
  const sql = await getSql();
  const existing = await sql<{ user_id: string }>`select user_id from profiles where user_id = ${userId}`;
  if (existing.length === 0) {
    const stem = seedUsername(email, userId);
    for (let n = 0; n < 30; n++) {
      const username = n === 0 ? stem : `${stem.slice(0, 18)}${n + 1}`;
      const taken = await sql<{ user_id: string }>`
        select user_id from profiles where lower(username) = ${username}
      `;
      if (taken.length > 0) continue;
      await sql`
        insert into profiles (user_id, display_name, username, is_public, banner)
        values (${userId}, '', ${username}, false, 'amber')
      `;
      break;
    }
  }
  const named = await accountName(userId);
  if (named.length >= 2) {
    await sql`
      update profiles
      set display_name = ${named}
      where user_id = ${userId} and btrim(display_name) = ''
    `;
  }
  await grant(userId, "register");
}

export async function loadSnapshot(userId: string | null, email: string | null, staff: boolean): Promise<AccessSnapshot> {
  if (!userId) {
    return {
      signedIn: false,
      staff,
      caps: staff ? [...CAPABILITIES] : [],
      visibilitySet: true,
    };
  }
  await ensureProfile(userId, email);
  const sql = await getSql();
  const rows = await sql<{ capability: string }>`
    select capability from access_grants where user_id = ${userId}
  `;
  const caps = new Set<Capability>();
  let role = staff;
  for (const row of rows) {
    if (row.capability === "staff") role = true;
    if (isCapability(row.capability)) caps.add(row.capability);
  }
  caps.add("register");
  if (role) {
    for (const capability of CAPABILITIES) caps.add(capability);
  }
  const profiles = await sql<{ visibility_set: boolean }>`
    select visibility_set from profiles where user_id = ${userId}
  `;
  return {
    signedIn: true,
    staff: role,
    caps: [...caps],
    visibilitySet: profiles[0]?.visibility_set === true,
  };
}

async function loadActivity(userId: string): Promise<Activity> {
  const sql = await getSql();
  const participations = await sql<{ role: string; checked_in: boolean; can_build: boolean }>`
    select role, checked_in, can_build from participations where user_id = ${userId} order by created_at
  `;
  const submissions = await sql<{ title: string; team: string }>`
    select title, team from submissions where user_id = ${userId} order by created_at desc
  `;
  const contributions = await sql<{ role: string; note: string }>`
    select role, note from contributions where user_id = ${userId} order by created_at
  `;
  const votes = await sql<{ places: string }>`
    select places from rankings where user_id = ${userId} and event_slug = ${EVENT_SLUG}
  `;
  return {
    participations: participations.map((row) => ({
      event: EVENT_LABEL,
      role: row.role,
      checkedIn: row.checked_in === true,
      canBuild: row.can_build === true,
    })),
    submissions: submissions.map((row) => ({ title: row.title, team: row.team })),
    contributions: contributions.map((row) => ({ role: row.role, note: row.note })),
    vote: (votes[0]?.places ?? "").split("|").map((item) => item.trim()).filter(Boolean),
  };
}

type ProfileRow = {
  user_id: string;
  display_name: string;
  username: string;
  is_public: boolean;
  banner: string;
  avatar?: string | null;
};

function openProfile(row: ProfileRow, owner: boolean, activity: Activity): ProfileView {
  return {
    status: "open",
    owner,
    displayName: row.display_name,
    username: row.username,
    isPublic: row.is_public === true,
    banner: isBanner(row.banner) ? row.banner : "amber",
    avatar: row.avatar ?? "",
    activity,
  };
}

export async function readOwn(userId: string, email: string | null): Promise<ProfileView> {
  await ensureProfile(userId, email);
  const sql = await getSql();
  const rows = await sql<ProfileRow>`
    select user_id, display_name, username, is_public, banner, avatar from profiles where user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) return { status: "missing" };
  return openProfile(row, true, await loadActivity(userId));
}

export async function readByUsername(username: string, viewerId: string | null): Promise<ProfileView> {
  const sql = await getSql();
  const key = username.trim().toLowerCase();
  const rows = await sql<ProfileRow>`
    select user_id, display_name, username, is_public, banner, avatar
    from profiles where lower(username) = ${key}
  `;
  const row = rows[0];
  if (!row) return { status: "missing" };
  const owner = viewerId === row.user_id;
  if (row.is_public !== true && !owner) return { status: "locked", username: row.username };
  return openProfile(row, owner, await loadActivity(row.user_id));
}

export async function writeProfile(
  userId: string,
  input: { displayName: string; username: string; isPublic: boolean; banner: BannerId },
): Promise<ProfileView> {
  const sql = await getSql();
  const clash = await sql<{ user_id: string }>`
    select user_id from profiles where lower(username) = ${input.username} and user_id <> ${userId}
  `;
  if (clash.length > 0) throw new Error("That username is taken.");
  await sql`
    update profiles
    set display_name = ${input.displayName},
        username = ${input.username},
        is_public = ${input.isPublic},
        banner = ${input.banner},
        updated_at = now()
    where user_id = ${userId}
  `;
  return readOwn(userId, null);
}

export async function chooseVisibility(userId: string, isPublic: boolean) {
  const sql = await getSql();
  await sql`
    update profiles
    set is_public = ${isPublic}, visibility_set = true, updated_at = now()
    where user_id = ${userId}
  `;
}

export async function recordJoin(
  userId: string,
  email: string | null,
  input: { name: string; ticket: TicketKind; profilePublic: boolean; code: string },
) {
  await ensureProfile(userId, email);
  const copy = TICKET_COPY[input.ticket];
  const sql = await getSql();
  const paid = await sql<{ id: number }>`
    select id from payments
    where user_id = ${userId} and status = 'accepted'
    order by created_at desc
    limit 1
  `;
  if (!paid[0]) throw new Error("Payment has not been accepted.");
  await sql`
    update profiles
    set display_name = case when display_name = '' then ${input.name} else display_name end,
        is_public = ${input.profilePublic},
        visibility_set = true,
        updated_at = now()
    where user_id = ${userId}
  `;
  await sql`
    insert into participations (user_id, event_slug, role, door_code)
    values (${userId}, ${EVENT_SLUG}, ${copy.participation}, ${input.code})
    on conflict (user_id, event_slug, role) do update set door_code = ${input.code}
  `;
  await sql`
    insert into contributions (user_id, event_slug, role, note)
    values (${userId}, ${EVENT_SLUG}, ${copy.contribution}, ${copy.note})
    on conflict (user_id, event_slug, role) do nothing
  `;
  if (copy.phone) await grant(userId, "phone");
  if (copy.room) await grant(userId, "room");
}

export async function markDoor(code: string, call: "build" | "watch") {
  const sql = await getSql();
  const saved = await sql`
    update participations
    set checked_in = true, can_build = ${call === "build"}, door_call = ${call}
    where event_slug = ${EVENT_SLUG}
      and upper(door_code) = ${code.trim().toUpperCase()}
      and exists (
        select 1 from payments
        where payments.user_id = participations.user_id
          and payments.status = 'accepted'
      )
    returning user_id
  `;
  if (!saved[0]) throw new Error("That code isn't paid, so they can't come in.");
}

export async function presentationQueue(): Promise<{ title: string; team: string }[]> {
  const deck = await showDeck();
  return deck.map((item) => ({ title: item.title, team: item.name }));
}

export type ShowCard = {
  title: string;
  description: string;
  background: string;
  name: string;
  avatar: string;
  onScreen: boolean;
};

export async function showDeck(): Promise<ShowCard[]> {
  const sql = await getSql();
  const rows = await sql<{
    title: string;
    description: string | null;
    background: string | null;
    name: string | null;
    avatar: string | null;
    on_screen: boolean | null;
  }>`
    select s.title,
      s.description,
      s.background,
      s.on_screen,
      coalesce(nullif(pr.display_name, ''), nullif(s.team, ''), 'Guest') as name,
      coalesce(pr.avatar, '') as avatar
    from submissions s
    join participations p on p.user_id = s.user_id and p.event_slug = s.event_slug
    left join profiles pr on pr.user_id = s.user_id
    where s.event_slug = ${EVENT_SLUG}
      and s.on_screen = true
      and length(trim(s.title)) >= 2
      and exists (
        select 1 from payments
        where payments.user_id = s.user_id and payments.status = 'accepted'
      )
    order by s.created_at asc
  `;
  return rows.map((row) => ({
    title: row.title,
    description: row.description ?? "",
    background: row.background || "amber",
    name: row.name ?? "Guest",
    avatar: row.avatar ?? "",
    onScreen: row.on_screen !== false,
  }));
}

export async function readShowCursor(): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ index: number }>`select index from show_cursor where event_slug = ${EVENT_SLUG}`;
  return Number(rows[0]?.index ?? 0);
}

export async function writeShowCursor(index: number): Promise<number> {
  const deck = await showDeck();
  const next = Math.max(0, Math.min(deck.length, Math.round(index)));
  const sql = await getSql();
  await sql`
    insert into show_cursor (event_slug, index)
    values (${EVENT_SLUG}, ${next})
    on conflict (event_slug) do update set index = ${next}
  `;
  return next;
}

export async function readMyPiece(userId: string): Promise<ShowCard | null> {
  const sql = await getSql();
  const rows = await sql<{
    title: string;
    description: string | null;
    background: string | null;
    name: string | null;
    avatar: string | null;
    on_screen: boolean | null;
  }>`
    select s.title, s.description, s.background, s.on_screen,
      coalesce(nullif(pr.display_name, ''), nullif(s.team, ''), '') as name,
      coalesce(pr.avatar, '') as avatar
    from submissions s
    left join profiles pr on pr.user_id = s.user_id
    where s.user_id = ${userId} and s.event_slug = ${EVENT_SLUG}
    order by s.created_at desc
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    title: row.title,
    description: row.description ?? "",
    background: row.background || "amber",
    name: row.name ?? "",
    avatar: row.avatar ?? "",
    onScreen: row.on_screen !== false,
  };
}

export async function saveRanking(userId: string, places: string[]) {
  const sql = await getSql();
  const packed = places.join("|");
  await sql`
    insert into rankings (user_id, event_slug, places)
    values (${userId}, ${EVENT_SLUG}, ${packed})
    on conflict (user_id, event_slug) do update set places = ${packed}
  `;
}

export async function saveJudge(title: string) {
  const sql = await getSql();
  await sql`
    insert into judge_picks (event_slug, title)
    values (${EVENT_SLUG}, ${title})
    on conflict (event_slug) do update set title = ${title}
  `;
}

export async function recordWork(
  userId: string,
  title: string,
  description: string,
  background: string,
  onScreen: boolean,
) {
  const sql = await getSql();
  const names = await sql<{ name: string | null }>`
    select coalesce(nullif(display_name, ''), '') as name from profiles where user_id = ${userId}
  `;
  const team = names[0]?.name?.trim() || "Guest";
  const existing = await sql<{ id: number }>`
    select id from submissions where user_id = ${userId} and event_slug = ${EVENT_SLUG} order by created_at desc limit 1
  `;
  if (existing[0]) {
    await sql`
      update submissions
      set title = ${title}, team = ${team}, description = ${description}, background = ${background}, on_screen = ${onScreen}
      where id = ${existing[0].id}
    `;
    return;
  }
  await sql`
    insert into submissions (user_id, event_slug, title, team, description, background, on_screen)
    values (${userId}, ${EVENT_SLUG}, ${title}, ${team}, ${description}, ${background}, ${onScreen})
  `;
}

export async function saveAvatar(userId: string, avatar: string) {
  const sql = await getSql();
  await sql`update profiles set avatar = ${avatar}, updated_at = now() where user_id = ${userId}`;
}

export async function writeFold() {
  const sql = await getSql();
  const queue = await presentationQueue();
  const saved = await sql<{ title: string; description: string | null; on_screen: boolean | null; name: string | null }>`
    select s.title, s.description, s.on_screen,
      coalesce(nullif(pr.display_name, ''), nullif(s.team, ''), 'Guest') as name
    from submissions s
    left join profiles pr on pr.user_id = s.user_id
    where s.event_slug = ${EVENT_SLUG}
    order by s.created_at asc
  `;
  const judge = await sql<{ title: string }>`select title from judge_picks where event_slug = ${EVENT_SLUG}`;
  const snapshot = [
    "AVCLUB PILOT archive",
    judge[0] ? `Judge's first: ${judge[0].title}` : "Judge's first: not picked",
    "On the screen:",
    ...queue.map((item, index) => `${index + 1}. ${item.title} — ${item.team}`),
    "",
    "Every response:",
    ...saved.map((item) => {
      const place = item.on_screen === false ? "kept, not on screen" : "on screen";
      return `- ${item.name}: ${item.title || "(no title)"} — ${place}. ${item.description ?? ""}`.trim();
    }),
  ].join("\n");
  await sql`
    insert into night_fold (event_slug, snapshot)
    values (${EVENT_SLUG}, ${snapshot})
    on conflict (event_slug) do update set snapshot = ${snapshot}, folded_at = now()
  `;
}

export async function grantStaff(userId: string) {
  await grant(userId, "staff");
  await grant(userId, "door");
  await grant(userId, "room");
  await grant(userId, "floor");
  await grant(userId, "phone");
}

export async function grantCapability(username: string, capability: "door" | "room" | "floor") {
  const sql = await getSql();
  const rows = await sql<{ user_id: string }>`
    select user_id from profiles where lower(username) = ${username.trim().toLowerCase()}
  `;
  const userId = rows[0]?.user_id;
  if (!userId) throw new Error("No profile with that username. They need to sign in once.");
  await grant(userId, capability);
  const role = STAFF_ROLE[capability];
  await sql`
    insert into contributions (user_id, event_slug, role, note)
    values (${userId}, ${EVENT_SLUG}, ${role}, 'Allowed in by staff.')
    on conflict (user_id, event_slug, role) do nothing
  `;
  return { ok: true as const, username: username.trim().toLowerCase(), capability };
}
