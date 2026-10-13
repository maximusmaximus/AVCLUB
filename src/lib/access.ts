import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { BANNERS, type AccessSnapshot, type BannerId, type ProfileView } from "@/lib/access-model";
import type { TicketKind } from "@/lib/night/model";
import { isBackground } from "@/lib/night/slides";

export type { AccessSnapshot, BannerId, ProfileView };
export { BANNERS };

const USERNAME = /^[a-z0-9][a-z0-9-]{1,22}[a-z0-9]$/;

const optionalAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const { isAdminUser } = await import("@/lib/staff.server");
    const user = await getSessionUser(context.bearerToken);
    const staff = await isAdminUser(user);
    return next({
      context: {
        userId: user?.id ?? null,
        email: user?.email ?? null,
        staff,
      },
    });
  });

function cleanName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function profileInput(input: { displayName: string; username: string; isPublic: boolean; banner: string }) {
  const displayName = cleanName(input.displayName ?? "");
  const username = (input.username ?? "").trim().toLowerCase();
  const banner = input.banner;
  if (displayName.length < 2 || displayName.length > 48) throw new Error("Use a name, up to 48 characters.");
  if (!USERNAME.test(username)) throw new Error("Usernames are 3–24 letters, numbers, or hyphens.");
  if (!(BANNERS as readonly string[]).includes(banner)) throw new Error("Pick a banner.");
  return { displayName, username, isPublic: input.isPublic === true, banner: banner as BannerId };
}

export const loadAccess = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .handler(async ({ context }): Promise<AccessSnapshot> => {
    const { loadSnapshot } = await import("@/lib/access.server");
    return loadSnapshot(context.userId, context.email, context.staff);
  });

export const loadMyProfile = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .handler(async ({ context }): Promise<ProfileView> => {
    if (!context.userId) return { status: "missing" };
    const { readOwn } = await import("@/lib/access.server");
    return readOwn(context.userId, context.email);
  });

export const loadPublicProfile = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator((input: { username: string }) => {
    const username = input.username?.trim().toLowerCase() ?? "";
    if (!username || username.length > 24) throw new Error("That profile doesn't exist.");
    return { username };
  })
  .handler(async ({ context, data }): Promise<ProfileView> => {
    const { readByUsername } = await import("@/lib/access.server");
    return readByUsername(data.username, context.userId);
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator(profileInput)
  .handler(async ({ context, data }): Promise<ProfileView> => {
    if (!context.userId) throw new Error("Sign in first.");
    const { writeProfile } = await import("@/lib/access.server");
    return writeProfile(context.userId, data);
  });

export const recordNightJoin = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator(
    (input: {
      name: string;
      ticket: TicketKind;
      profilePublic: boolean;
      code: string;
      donation: number;
      method: "card" | "apple" | "google" | "code";
      inviteCode?: string | null;
      last4?: string;
      expMonth?: number;
      expYear?: number;
    }) => {
      const name = cleanName(input.name ?? "");
      const ticket = input.ticket;
      const method = input.method;
      if (name.length < 2) throw new Error("Use the name the door should call.");
      if (ticket !== "deposit" && ticket !== "supporter" && ticket !== "cosponsor") {
        throw new Error("Pick how you are showing up.");
      }
      if (method !== "card" && method !== "apple" && method !== "google" && method !== "code") {
        throw new Error("Pick a way to pay.");
      }
      const donation = Math.round(Number(input.donation ?? 0));
      if (!Number.isInteger(donation) || donation < 0 || donation > 500) {
        throw new Error("The extra amount is in dollars, up to $500.");
      }
      return {
        name,
        ticket,
        profilePublic: input.profilePublic === true,
        code: (input.code ?? "").trim().toUpperCase(),
        donation,
        method,
        inviteCode: (input.inviteCode ?? "").trim().toUpperCase() || null,
        last4: (input.last4 ?? "").replace(/\D/g, "").slice(-4),
        expMonth: Math.round(Number(input.expMonth ?? 0)),
        expYear: Math.round(Number(input.expYear ?? 0)),
      };
    },
  )
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Sign in before you register.");
    if (data.method !== "code") throw new Error("Pay before you are on the list.");
    const { acceptCoveredEntry } = await import("@/lib/pay.server");
    const paid = await acceptCoveredEntry({
      userId: context.userId,
      email: context.email,
      name: data.name,
      ticket: data.ticket,
      donation: data.donation,
      inviteCode: data.inviteCode,
    });
    if (data.ticket === "deposit") {
      const { redeemInvite } = await import("@/lib/invites.server");
      const redeemed = await redeemInvite(paid.inviteCode, data.ticket, data.name);
      if (!redeemed) throw new Error("That code has already been used.");
    }
    const { recordJoin } = await import("@/lib/access.server");
    await recordJoin(context.userId, context.email, data);
    const { sendTicketMail } = await import("@/lib/mail.server");
    const mailed = await sendTicketMail({
      email: context.email,
      name: data.name,
      code: data.code,
      ticket: data.ticket,
    });
    return { ok: true as const, mailed };
  });

export const startEntryCheckout = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator(
    (input: { name: string; ticket: TicketKind; profilePublic: boolean; code: string; donation: number; inviteCode?: string | null }) => {
      const name = cleanName(input.name ?? "");
      const ticket = input.ticket;
      if (name.length < 2) throw new Error("Use the name the door should call.");
      if (ticket !== "deposit" && ticket !== "supporter" && ticket !== "cosponsor") throw new Error("Pick how you are showing up.");
      const donation = Math.round(Number(input.donation ?? 0));
      if (!Number.isInteger(donation) || donation < 0 || donation > 500) throw new Error("The extra amount is in dollars, up to $500.");
      return {
        name,
        ticket,
        profilePublic: input.profilePublic === true,
        code: (input.code ?? "").trim().toUpperCase(),
        donation,
        inviteCode: (input.inviteCode ?? "").trim().toUpperCase() || null,
      };
    },
  )
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Sign in before you pay.");
    const { startCardCheckout } = await import("@/lib/pay.server");
    return startCardCheckout({
      userId: context.userId,
      email: context.email,
      ...data,
    });
  });

export const finishEntryCheckout = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator((input: { sessionId: string }) => {
    const sessionId = (input.sessionId ?? "").trim();
    if (!sessionId || sessionId.length > 255) throw new Error("Missing payment.");
    return { sessionId };
  })
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Sign in before you pay.");
    const { acceptStripeSession } = await import("@/lib/pay.server");
    const paid = await acceptStripeSession({
      userId: context.userId,
      email: context.email,
      sessionId: data.sessionId,
    });
    if (paid.inviteCode && paid.ticket === "deposit") {
      const { lookupInvite, redeemInvite } = await import("@/lib/invites.server");
      const redeemed = await redeemInvite(paid.inviteCode, paid.ticket, paid.name);
      if (!redeemed) {
        const existing = await lookupInvite(paid.inviteCode);
        if (!existing?.usedAt || existing.usedName !== paid.name) throw new Error("That code has already been used.");
      }
    }
    const { recordJoin } = await import("@/lib/access.server");
    await recordJoin(context.userId, context.email, paid);
    const { sendTicketMail } = await import("@/lib/mail.server");
    const mailed = await sendTicketMail({
      email: context.email,
      name: paid.name,
      code: paid.code,
      ticket: paid.ticket,
    });
    return { ok: true as const, mailed, ...paid };
  });

export const recordMyWork = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator((input: { title: string; description: string; background: string; onScreen?: boolean }) => {
    const title = cleanName(input.title ?? "");
    const description = (input.description ?? "").trim().replace(/\s+/g, " ").slice(0, 400);
    const background = input.background ?? "";
    const onScreen = input.onScreen !== false;
    if (title.length > 80) throw new Error("That title is too long.");
    if (onScreen && title.length < 2) throw new Error("Give the piece a title, or mark nothing to share.");
    if (!isBackground(background)) throw new Error("Pick a background.");
    return { title, description, background, onScreen };
  })
  .handler(async ({ context, data }) => {
    if (!context.userId) return { ok: false as const };
    const { recordWork } = await import("@/lib/access.server");
    await recordWork(context.userId, data.title, data.description, data.background, data.onScreen);
    return { ok: true as const };
  });

export const saveMyAvatar = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator((input: { avatar: string }) => {
    const avatar = input.avatar ?? "";
    if (avatar !== "" && (!avatar.startsWith("data:image/jpeg;base64,") || avatar.length > 120_000)) {
      throw new Error("Use a smaller picture.");
    }
    return { avatar };
  })
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Sign in first.");
    const { saveAvatar } = await import("@/lib/access.server");
    await saveAvatar(context.userId, data.avatar);
    return { ok: true as const };
  });

export const chooseProfileVisibility = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator((input: { isPublic: boolean }) => ({ isPublic: input.isPublic === true }))
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Sign in first.");
    const { chooseVisibility } = await import("@/lib/access.server");
    await chooseVisibility(context.userId, data.isPublic);
    return { ok: true as const };
  });

export const markCheckedIn = createServerFn({ method: "POST" })
  .validator((input: { code: string; call: "build" | "watch" }) => {
    const code = input.code?.trim().toUpperCase() ?? "";
    if (code.length < 4) throw new Error("That code is too short.");
    if (input.call !== "build" && input.call !== "watch") throw new Error("Pick build or watch.");
    return { code, call: input.call };
  })
  .handler(async ({ data }) => {
    const { currentStaff } = await import("@/lib/staff.server");
    if (!(await currentStaff())) return { ok: false as const };
    const { markDoor } = await import("@/lib/access.server");
    await markDoor(data.code, data.call);
    return { ok: true as const };
  });

export const loadQueue = createServerFn({ method: "POST" }).handler(async () => {
  const { presentationQueue } = await import("@/lib/access.server");
  return presentationQueue();
});

export const loadDeck = createServerFn({ method: "POST" }).handler(async () => {
  const { showDeck, readShowCursor } = await import("@/lib/access.server");
  const cards = await showDeck();
  const index = await readShowCursor();
  return { cards, index: Math.max(0, Math.min(index, cards.length)) };
});

export const loadMyPiece = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .handler(async ({ context }) => {
    if (!context.userId) return null;
    const { readMyPiece } = await import("@/lib/access.server");
    return readMyPiece(context.userId);
  });

export const moveShow = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator((input: { index: number }) => {
    const index = Math.round(Number(input.index));
    if (!Number.isInteger(index) || index < 0 || index > 500) throw new Error("That slide isn't on the deck.");
    return { index };
  })
  .handler(async ({ context, data }) => {
    const { currentStaff } = await import("@/lib/staff.server");
    if (!(await currentStaff())) {
      if (!context.userId) throw new Error("Sign in first.");
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql<{ capability: string }>`
        select capability from access_grants where user_id = ${context.userId} and capability in ('floor', 'staff') limit 1
      `;
      if (!rows[0]) throw new Error("Only the floor can move the screen.");
    }
    const { writeShowCursor } = await import("@/lib/access.server");
    const index = await writeShowCursor(data.index);
    return { index };
  });

export const saveMyRanking = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator((input: { places: string[] }) => {
    const places = (Array.isArray(input.places) ? input.places : [])
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.length <= 80)
      .slice(0, 40);
    return { places };
  })
  .handler(async ({ context, data }) => {
    if (!context.userId) return { ok: false as const };
    const { saveRanking } = await import("@/lib/access.server");
    await saveRanking(context.userId, data.places);
    return { ok: true as const };
  });

export const saveJudgePick = createServerFn({ method: "POST" })
  .validator((input: { title: string }) => {
    const title = input.title?.trim().replace(/\s+/g, " ") ?? "";
    if (title.length < 2 || title.length > 80) throw new Error("Pick a piece.");
    return { title };
  })
  .handler(async ({ data }) => {
    const { currentStaff } = await import("@/lib/staff.server");
    if (!(await currentStaff())) throw new Error("Sign in first.");
    const { saveJudge } = await import("@/lib/access.server");
    await saveJudge(data.title);
    return { ok: true as const };
  });

export const foldIfEnded = createServerFn({ method: "POST" }).handler(async () => {
  const end = new Date("2026-10-16T19:15:00-07:00").getTime();
  if (Date.now() < end) return { folded: false as const };
  const { writeFold } = await import("@/lib/access.server");
  await writeFold();
  return { folded: true as const };
});

export const grantAccess = createServerFn({ method: "POST" })
  .validator((input: { username: string; capability: "door" | "room" | "floor" }) => {
    const username = input.username?.trim().toLowerCase() ?? "";
    const capability = input.capability;
    if (!USERNAME.test(username)) throw new Error("Enter their username.");
    if (capability !== "door" && capability !== "room" && capability !== "floor") {
      throw new Error("Pick door, room, or floor.");
    }
    return { username, capability };
  })
  .handler(async ({ data }) => {
    const { currentStaff } = await import("@/lib/staff.server");
    if (!(await currentStaff())) throw new Error("Sign in first.");
    const { grantCapability } = await import("@/lib/access.server");
    return grantCapability(data.username, data.capability);
  });
