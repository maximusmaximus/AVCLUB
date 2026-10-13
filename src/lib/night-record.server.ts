import { getSql } from "@/lib/db";
import { nightKey, type WorkItem } from "@/lib/night/calendar";

export interface StoredProgram {
  nightOn: string;
  shares: WorkItem[];
  presented: WorkItem[];
  ranking: string[];
  attendees: { name: string; ticket: string }[];
}

function parseJson(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}
function asItems(value: unknown): WorkItem[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { title?: unknown; team?: unknown; blurb?: unknown };
    const title = typeof row.title === "string" ? row.title : "";
    const team = typeof row.team === "string" ? row.team : "";
    if (title.length < 2 || team.length < 2) return [];
    const blurb = typeof row.blurb === "string" ? row.blurb : undefined;
    return [{ title, team, ...(blurb ? { blurb } : {}) }];
  });
}

function asRanking(value: unknown): string[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asAttendees(value: unknown): { name: string; ticket: string }[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { name?: unknown; ticket?: unknown };
    const name = typeof row.name === "string" ? row.name : "";
    const ticket = typeof row.ticket === "string" ? row.ticket : "";
    if (name.length < 2) return [];
    return [{ name, ticket }];
  });
}

export async function readProgram(): Promise<StoredProgram> {
  const nightOn = nightKey();
  const sql = await getSql();
  const shares = await sql<{ title: string; team: string }>`
    select title, team from night_shares
    where night_on = ${nightOn}
    order by created_at asc
  `;
  const snaps = await sql<{ presented: unknown; ranking: unknown; attendees: unknown }>`
    select presented, ranking, attendees from night_snapshots where night_on = ${nightOn}
  `;
  return {
    nightOn,
    shares: shares.map((row) => ({ title: row.title, team: row.team })),
    presented: asItems(snaps[0]?.presented),
    ranking: asRanking(snaps[0]?.ranking),
    attendees: asAttendees(snaps[0]?.attendees),
  };
}

export async function writeShare(title: string, team: string): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into night_shares (night_on, title, team)
    values (${nightKey()}, ${title}, ${team})
  `;
}

export async function writeSnapshot(
  presented: WorkItem[],
  ranking: string[],
  attendees: { name: string; ticket: string }[],
): Promise<StoredProgram> {
  const nightOn = nightKey();
  const sql = await getSql();
  if (presented.length === 0) {
    await sql`delete from night_snapshots where night_on = ${nightOn}`;
    return readProgram();
  }
  await sql`
    insert into night_snapshots (night_on, presented, ranking, attendees)
    values (
      ${nightOn},
      ${JSON.stringify(presented)}::jsonb,
      ${JSON.stringify(ranking)}::jsonb,
      ${JSON.stringify(attendees)}::jsonb
    )
    on conflict (night_on) do update
      set presented = excluded.presented,
          ranking = excluded.ranking,
          attendees = excluded.attendees,
          updated_at = now()
  `;
  return readProgram();
}
