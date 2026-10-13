import { EVENT } from "@/lib/night/model";

export type InviteTicket = "night" | "deposit" | "party";

export function ticketDue(amount: number, percent: number): number {
  return Math.round(amount * (100 - percent)) / 100;
}

export function money(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

export function coversTicket(scope: InviteTicket, ticket: string): boolean {
  if (ticket !== "deposit") return false;
  return scope === "night" || scope === "deposit";
}

export function ticketScopeLabel(scope: InviteTicket): string {
  if (scope === "party") return "Party only";
  return "Entry";
}

export function invitationText(input: { code: string; percent: number; ticket: InviteTicket }): string {
  const cover =
    input.percent >= 100
      ? "This code covers the ticket. You do not pay."
      : `This code takes ${input.percent}% off the ticket.`;
  return [
    "You're invited to Audio Visual Club.",
    `${EVENT.name} · ${EVENT.startsLabel}`,
    EVENT.venue,
    "",
    cover,
    `Good for: ${ticketScopeLabel(input.ticket)}`,
    `Grant Code: ${input.code}`,
    "",
    "Enter the Grant Code when you sign up. One guest. It will not work twice.",
  ].join("\n");
}
