import { createServerFn } from "@tanstack/react-start";
import type { WorkItem } from "@/lib/night/calendar";

function cleanWork(input: unknown): WorkItem[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { title?: unknown; team?: unknown; blurb?: unknown };
    const title = typeof row.title === "string" ? row.title.trim().replace(/\s+/g, " ") : "";
    const team = typeof row.team === "string" ? row.team.trim().replace(/\s+/g, " ") : "";
    const blurb = typeof row.blurb === "string" ? row.blurb.trim().replace(/\s+/g, " ") : "";
    if (title.length < 2 || title.length > 80 || team.length < 2 || team.length > 60) return [];
    return [{ title, team, ...(blurb ? { blurb: blurb.slice(0, 160) } : {}) }];
  });
}

export const getNightProgram = createServerFn({ method: "POST" }).handler(async () => {
  const { readProgram } = await import("./night-record.server");
  return readProgram();
});

export const recordShare = createServerFn({ method: "POST" })
  .validator((input: { title: string; team: string }) => {
    const title = input.title?.trim().replace(/\s+/g, " ") ?? "";
    const team = input.team?.trim().replace(/\s+/g, " ") ?? "";
    if (title.length < 2 || title.length > 80 || team.length < 2 || team.length > 60) {
      throw new Error("Add a title and a team.");
    }
    return { title, team };
  })
  .handler(async ({ data }) => {
    const { writeShare } = await import("./night-record.server");
    await writeShare(data.title, data.team);
    return { ok: true as const };
  });

export const saveNightSnapshot = createServerFn({ method: "POST" })
  .validator((input: { presented: WorkItem[]; ranking: string[]; attendees?: { name: string; ticket: string }[] }) => {
    const presented = cleanWork(input.presented).slice(0, 40);
    const ranking = (Array.isArray(input.ranking) ? input.ranking : [])
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.length <= 80)
      .slice(0, 40);
    const attendees = (Array.isArray(input.attendees) ? input.attendees : [])
      .flatMap((item) => {
        const name = item?.name?.trim().replace(/\s+/g, " ") ?? "";
        const ticket = item?.ticket?.trim().replace(/\s+/g, " ") ?? "";
        if (name.length < 2 || name.length > 80) return [];
        return [{ name, ticket: ticket.slice(0, 40) }];
      })
      .slice(0, 80);
    return { presented, ranking, attendees };
  })
  .handler(async ({ data }) => {
    const { currentStaff } = await import("./staff.server");
    if (!(await currentStaff())) throw new Error("Sign in first.");
    const { writeSnapshot } = await import("./night-record.server");
    return writeSnapshot(data.presented, data.ranking, data.attendees);
  });
