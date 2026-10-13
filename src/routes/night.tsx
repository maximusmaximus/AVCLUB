import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { NightApp } from "@/components/night/shell";
import { getSiteMode, staffSession } from "@/lib/staff";

export const Route = createFileRoute("/night")({
  loader: async () => {
    try {
      const [mode, session] = await Promise.all([getSiteMode(), staffSession()]);
      if (!mode.live && !session.signedIn) throw redirect({ to: "/" });
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({ to: "/" });
    }
  },
  component: Night,
  head: () => ({
    meta: [{ title: "AVCLUB — the night" }],
  }),
});

function Night() {
  return <NightApp />;
}
