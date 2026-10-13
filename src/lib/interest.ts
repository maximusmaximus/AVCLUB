import { createServerFn } from "@tanstack/react-start";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const joinInterestList = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 254) {
      throw new Error("Use a real email.");
    }
    return { email };
  })
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into interest_signups (email)
      values (${data.email})
      on conflict (email) do nothing
    `;
    const { sendInterestMail } = await import("@/lib/mail.server");
    const mailed = await sendInterestMail(data.email);
    return { ok: true as const, mailed };
  });
