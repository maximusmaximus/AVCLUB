import { createServerFn } from "@tanstack/react-start";
import { coversTicket, type InviteTicket } from "@/lib/invites";

function cleanCode(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function cleanTicket(value: unknown): InviteTicket {
  if (value === "deposit" || value === "night") return value;
  throw new Error("Codes cover the entry.");
}

export const listInvites = createServerFn({ method: "POST" }).handler(async () => {
  const { currentStaff } = await import("./staff.server");
  if (!(await currentStaff())) throw new Error("Sign in first.");
  const { listInvites: read } = await import("./invites.server");
  return read();
});

export const createInvites = createServerFn({ method: "POST" })
  .validator((input: { percent: number; ticket: InviteTicket; label?: string; count?: number }) => {
    const percent = Math.round(Number(input.percent));
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) throw new Error("Percent is 1 to 100.");
    const count = Math.round(Number(input.count ?? 1));
    if (!Number.isInteger(count) || count < 1 || count > 25) throw new Error("Make between 1 and 25.");
    const label = (input.label ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    return { percent, ticket: cleanTicket(input.ticket), label, count };
  })
  .handler(async ({ data }) => {
    const { currentStaff } = await import("./staff.server");
    if (!(await currentStaff())) throw new Error("Sign in first.");
    const { createInvites: write } = await import("./invites.server");
    return write(data);
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .validator((input: { id: number }) => {
    const id = Number(input.id);
    if (!Number.isInteger(id) || id < 1) throw new Error("Missing code.");
    return { id };
  })
  .handler(async ({ data }) => {
    const { currentStaff } = await import("./staff.server");
    if (!(await currentStaff())) throw new Error("Sign in first.");
    const { revokeInvite: drop } = await import("./invites.server");
    await drop(data.id);
    return { ok: true as const };
  });

export const previewInvite = createServerFn({ method: "POST" })
  .validator((input: { code: string }) => {
    const code = cleanCode(input.code);
    if (!/^AV-[A-Z2-9]{4}$/.test(code)) throw new Error("That code doesn't look right.");
    return { code };
  })
  .handler(async ({ data }) => {
    const { lookupInvite } = await import("./invites.server");
    const row = await lookupInvite(data.code);
    if (!row || row.usedAt) return { ok: false as const, error: "That code is used or not on the list." };
    return { ok: true as const, code: row.code, percent: row.percent, ticket: row.ticket };
  });

export const redeemInvite = createServerFn({ method: "POST" })
  .validator((input: { code: string; ticket: string; name: string }) => {
    const code = cleanCode(input.code);
    const name = input.name?.trim().replace(/\s+/g, " ") ?? "";
    if (!/^AV-[A-Z2-9]{4}$/.test(code)) throw new Error("That code doesn't look right.");
    if (input.ticket !== "deposit") throw new Error("Grant Codes cover the entry.");
    const ticket = input.ticket;
    if (name.length < 2 || name.length > 48) throw new Error("Use the name the door should call.");
    return { code, ticket, name };
  })
  .handler(async ({ data }) => {
    const { lookupInvite, redeemInvite: take } = await import("./invites.server");
    const existing = await lookupInvite(data.code);
    if (!existing) return { ok: false as const, error: "That code is not on the list." };
    if (existing.usedAt) return { ok: false as const, error: "That code has already been used." };
    if (!coversTicket(existing.ticket, data.ticket)) {
      return { ok: false as const, error: "That code doesn't cover this ticket." };
    }
    const row = await take(data.code, data.ticket, data.name);
    if (!row) return { ok: false as const, error: "That code has already been used." };
    return { ok: true as const, code: row.code, percent: row.percent };
  });
