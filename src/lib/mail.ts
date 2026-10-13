import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { PHASES, type PhaseId } from "@/lib/night/model";

const PHASE_IDS = new Set(PHASES.map((phase) => phase.id));

const optionalAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const user = await getSessionUser(context.bearerToken);
    return next({ context: { userId: user?.id ?? null } });
  });

export const syncNightMail = createServerFn({ method: "POST" }).handler(async () => {
  const { syncNightMail: sync } = await import("@/lib/mail.server");
  return sync();
});

export const flushMail = createServerFn({ method: "POST" }).handler(async () => {
  const { flushMail: flush } = await import("@/lib/mail.server");
  return flush();
});

export const loadMailStatus = createServerFn({ method: "POST" }).handler(async () => {
  const { mailStatus } = await import("@/lib/mail.server");
  return mailStatus();
});

export const loadLivePhase = createServerFn({ method: "POST" }).handler(async () => {
  const { readLivePhase } = await import("@/lib/mail.server");
  return readLivePhase();
});

export const announceLivePhase = createServerFn({ method: "POST" })
  .middleware([optionalAuth])
  .validator((input: { phase: string; mount?: boolean }) => {
    const phase = input.phase as PhaseId;
    if (!PHASE_IDS.has(phase)) throw new Error("That part of the night doesn't exist.");
    return { phase, mount: input.mount === true };
  })
  .handler(async ({ context, data }) => {
    const { announceLivePhase: announce } = await import("@/lib/mail.server");
    return announce(data.phase, context.userId, data.mount);
  });
