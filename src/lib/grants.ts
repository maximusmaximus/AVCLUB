import { createServerFn } from "@tanstack/react-start";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const applyForGrant = createServerFn({ method: "POST" })
  .validator((input: { name: string; email: string; work: string }) => {
    const name = (input.name ?? "").trim().replace(/\s+/g, " ");
    const email = (input.email ?? "").trim().toLowerCase();
    const work = (input.work ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 48) throw new Error("Use your name.");
    if (!EMAIL.test(email) || email.length > 254) throw new Error("Use a real email.");
    if (work.length < 8 || work.length > 400) throw new Error("Say what you're making, in a sentence or two.");
    return { name, email, work };
  })
  .handler(async ({ data }) => {
    const { saveGrant } = await import("./grants.server");
    return saveGrant(data);
  });

export const listGrantApplications = createServerFn({ method: "POST" }).handler(async () => {
  const { currentStaff } = await import("./staff.server");
  if (!(await currentStaff())) throw new Error("Sign in first.");
  const { listGrants } = await import("./grants.server");
  return listGrants();
});

export const approveGrantApplication = createServerFn({ method: "POST" })
  .validator((input: { id: number }) => {
    const id = Number(input.id);
    if (!Number.isInteger(id) || id < 1) throw new Error("Missing application.");
    return { id };
  })
  .handler(async ({ data }) => {
    const { currentStaff } = await import("./staff.server");
    if (!(await currentStaff())) throw new Error("Sign in first.");
    const { approveGrant } = await import("./grants.server");
    return approveGrant(data.id);
  });

export const declineGrantApplication = createServerFn({ method: "POST" })
  .validator((input: { id: number }) => {
    const id = Number(input.id);
    if (!Number.isInteger(id) || id < 1) throw new Error("Missing application.");
    return { id };
  })
  .handler(async ({ data }) => {
    const { currentStaff } = await import("./staff.server");
    if (!(await currentStaff())) throw new Error("Sign in first.");
    const { declineGrant } = await import("./grants.server");
    await declineGrant(data.id);
    return { ok: true as const };
  });
