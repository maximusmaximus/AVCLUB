import { getSql } from "@/lib/db";
import { TICKETS, type TicketKind } from "@/lib/night/model";
import { coversTicket, ticketDue } from "@/lib/invites";
import { lookupInvite } from "@/lib/invites.server";

export type PayMethod = "card" | "apple" | "google" | "code";

function cents(dollars: number) {
  return Math.round(dollars * 100);
}

export async function quoteEntry(input: {
  ticket: TicketKind;
  donation: number;
  inviteCode: string | null;
}): Promise<{ dueCents: number; priceCents: number; donationCents: number; inviteCode: string | null }> {
  const chosen = TICKETS.find((item) => item.id === input.ticket);
  if (!chosen) throw new Error("Pick how you are showing up.");
  const donation = Math.round(input.donation);
  if (!Number.isInteger(donation) || donation < 0 || donation > 500) {
    throw new Error("The extra amount is in dollars, up to $500.");
  }
  let inviteCode: string | null = null;
  let price = chosen.amount;
  if (input.inviteCode) {
    const invite = await lookupInvite(input.inviteCode);
    if (!invite || invite.usedAt) throw new Error("That code is used or not on the list.");
    if (!coversTicket(invite.ticket, input.ticket)) throw new Error("That code doesn't cover this ticket.");
    price = ticketDue(chosen.amount, invite.percent);
    inviteCode = invite.code;
  }
  return {
    dueCents: cents(price) + cents(donation),
    priceCents: cents(price),
    donationCents: cents(donation),
    inviteCode,
  };
}

export async function acceptCoveredEntry(input: {
  userId: string;
  email: string | null;
  name: string;
  ticket: TicketKind;
  donation: number;
  inviteCode: string | null;
}): Promise<{ dueCents: number; inviteCode: string }> {
  const quote = await quoteEntry(input);
  if (quote.dueCents !== 0 || !quote.inviteCode) {
    throw new Error("This ticket still has a balance. Pay it before you are on the list.");
  }
  const sql = await getSql();
  await sql`
    insert into payments (user_id, email, name, ticket, amount_cents, donation_cents, method, status, invite_code)
    values (${input.userId}, ${input.email}, ${input.name}, ${input.ticket}, 0, 0, 'code', 'accepted', ${quote.inviteCode})
  `;
  return { dueCents: 0, inviteCode: quote.inviteCode };
}

function usableKey(value: string | null | undefined) {
  const key = value?.trim() ?? "";
  return key.startsWith("sk_live_") || key.startsWith("sk_test_") ? key : "";
}

async function stripeKey() {
  try {
    const sql = await getSql();
    const rows = await sql<{ stripe_secret: string | null }>`
      select stripe_secret from site_settings where id = 1
    `;
    const stored = rows[0]?.stripe_secret;
    if (stored === "") return "";
    const saved = usableKey(stored);
    if (saved) return saved;
  } catch {
    /* column arrives with the migration */
  }
  return usableKey(process.env.STRIPE_SECRET_KEY);
}

export async function stripeKeyStatus(): Promise<{ on: boolean; last4: string | null }> {
  const key = await stripeKey();
  return { on: Boolean(key), last4: key ? key.slice(-4) : null };
}

export async function saveStripeSecret(secret: string): Promise<{ on: boolean; last4: string | null }> {
  const { currentStaff } = await import("@/lib/staff.server");
  if (!(await currentStaff())) throw new Error("Sign in first.");
  const key = secret.trim();
  if (key && !usableKey(key)) throw new Error("Paste a Stripe secret key.");
  const sql = await getSql();
  await sql`update site_settings set stripe_secret = ${key} where id = 1`;
  return { on: Boolean(key), last4: key ? key.slice(-4) : null };
}

async function siteOrigin() {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const host = request?.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request?.headers.get("host") || "";
  if (!host) throw new Error("Couldn't start checkout.");
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : request?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  return `${proto}://${host}`;
}

async function stripeForm(path: string, body: URLSearchParams, method: "POST" | "GET" = "POST") {
  const key = await stripeKey();
  if (!key) throw new Error("Card checkout isn't connected yet. A Grant Code is the only way onto the list.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${key}`,
      ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? body : undefined,
  });
  const json = (await response.json()) as { error?: { message?: string }; url?: string; id?: string; payment_status?: string; metadata?: Record<string, string> };
  if (!response.ok) throw new Error(json.error?.message || "The payment service didn't accept that.");
  return json;
}

export async function startCardCheckout(input: {
  userId: string;
  email: string | null;
  name: string;
  ticket: TicketKind;
  donation: number;
  inviteCode: string | null;
  profilePublic: boolean;
  code: string;
}): Promise<{ url: string }> {
  const quote = await quoteEntry(input);
  if (quote.dueCents <= 0) throw new Error("Nothing to charge. Use the code.");
  const ticket = TICKETS.find((item) => item.id === input.ticket);
  const origin = siteOrigin();
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/night?checkout={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/night?checkout=cancel`);
  if (input.email) body.set("customer_email", input.email);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(quote.priceCents));
  body.set("line_items[0][price_data][product_data][name]", `AVCLUB PILOT · ${ticket?.name ?? "Entry"}`);
  if (quote.donationCents > 0) {
    body.set("line_items[1][quantity]", "1");
    body.set("line_items[1][price_data][currency]", "usd");
    body.set("line_items[1][price_data][unit_amount]", String(quote.donationCents));
    body.set("line_items[1][price_data][product_data][name]", "Future AV Club sessions");
  }
  body.set("metadata[userId]", input.userId);
  body.set("metadata[name]", input.name.slice(0, 80));
  body.set("metadata[ticket]", input.ticket);
  body.set("metadata[donation]", String(Math.round(input.donation)));
  body.set("metadata[inviteCode]", quote.inviteCode ?? "");
  body.set("metadata[profilePublic]", input.profilePublic ? "1" : "0");
  body.set("metadata[code]", input.code.slice(0, 12));
  body.set("metadata[amountCents]", String(quote.dueCents));
  const session = await stripeForm("checkout/sessions", body);
  if (!session.url) throw new Error("Checkout didn't return a payment page.");
  return { url: session.url };
}

export async function acceptStripeSession(input: {
  userId: string;
  email: string | null;
  sessionId: string;
}): Promise<{
  name: string;
  ticket: TicketKind;
  donation: number;
  inviteCode: string | null;
  profilePublic: boolean;
  code: string;
}> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(input.sessionId)) throw new Error("That payment session isn't valid.");
  const session = await stripeForm(`checkout/sessions/${input.sessionId}`, new URLSearchParams(), "GET");
  if (session.payment_status !== "paid") throw new Error("Payment was not accepted. You are not on the list.");
  const meta = session.metadata ?? {};
  if (meta.userId !== input.userId) throw new Error("This payment belongs to a different account.");
  const ticket = meta.ticket;
  if (ticket !== "deposit" && ticket !== "supporter" && ticket !== "cosponsor") throw new Error("That payment doesn't match a ticket.");
  const name = (meta.name ?? "").trim();
  const code = (meta.code ?? "").trim().toUpperCase();
  if (name.length < 2 || code.length < 4) throw new Error("That payment is missing the registration.");
  const donation = Math.round(Number(meta.donation ?? 0));
  const amount = Math.round(Number(meta.amountCents ?? 0));
  const inviteCode = meta.inviteCode?.trim() || null;
  const sql = await getSql();
  const existing = await sql<{ id: number }>`
    select id from payments where stripe_session = ${input.sessionId} and status = 'accepted' limit 1
  `;
  if (!existing[0]) {
    await sql`
      insert into payments (user_id, email, name, ticket, amount_cents, donation_cents, method, status, invite_code, stripe_session)
      values (
        ${input.userId},
        ${input.email},
        ${name},
        ${ticket},
        ${amount},
        ${cents(donation)},
        'card',
        'accepted',
        ${inviteCode},
        ${input.sessionId}
      )
    `;
  }
  return {
    name,
    ticket,
    donation,
    inviteCode,
    profilePublic: meta.profilePublic === "1",
    code,
  };
}
