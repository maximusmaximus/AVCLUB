import { createServerFn } from "@tanstack/react-start";

export const getSiteMode = createServerFn({ method: "POST" }).handler(async () => {
  const { readLive } = await import("./staff.server");
  return { live: await readLive() };
});

export const staffSession = createServerFn({ method: "POST" }).handler(async () => {
  const { currentStaff } = await import("./staff.server");
  const username = await currentStaff();
  return { signedIn: Boolean(username), username };
});

export const staffDesk = createServerFn({ method: "POST" }).handler(async () => {
  const { loadDesk } = await import("./staff.server");
  return loadDesk();
});

export const addDeskAdmin = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => {
    const email = input.email?.trim().toLowerCase() ?? "";
    if (!email || email.length > 254) throw new Error("Use a Google account email.");
    return { email };
  })
  .handler(async ({ data }) => {
    const { addAdmin } = await import("./staff.server");
    return { admins: await addAdmin(data.email) };
  });

export const removeDeskAdmin = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => {
    const email = input.email?.trim().toLowerCase() ?? "";
    if (!email) throw new Error("Missing admin.");
    return { email };
  })
  .handler(async ({ data }) => {
    const { removeAdmin } = await import("./staff.server");
    return { admins: await removeAdmin(data.email) };
  });

export const staffSignOut = createServerFn({ method: "POST" }).handler(async () => {
  const { logout } = await import("./staff.server");
  await logout();
  return { ok: true as const };
});

export const saveStripeKey = createServerFn({ method: "POST" })
  .validator((input: { secret: string }) => {
    const secret = (input.secret ?? "").trim();
    if (secret.length > 200) throw new Error("That key is too long.");
    return { secret };
  })
  .handler(async ({ data }) => {
    const { saveStripeSecret } = await import("./pay.server");
    return saveStripeSecret(data.secret);
  });

export const setSiteLive = createServerFn({ method: "POST" })
  .validator((input: { live: boolean }) => {
    if (typeof input.live !== "boolean") throw new Error("Pick a mode.");
    return { live: input.live };
  })
  .handler(async ({ data }) => {
    const { updateLive } = await import("./staff.server");
    return updateLive(data.live);
  });
