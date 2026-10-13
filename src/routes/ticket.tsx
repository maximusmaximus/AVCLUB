import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useNight, youPerson } from "@/lib/night/store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/ticket")({
  component: TicketPage,
  head: () => ({
    meta: [
      { title: "Your ticket — AVCLUB PILOT" },
      { name: "description", content: "Your name, code, and the night." },
      { property: "og:title", content: "AVCLUB PILOT ticket" },
      { property: "og:description", content: "Thu, Oct 16 · The Breakbeat, Chico." },
    ],
  }),
});

function TicketPage() {
  const you = useNight(youPerson);
  const { user, isPending } = useCurrentUserState();
  useEffect(() => {
    void useNight.persist.rehydrate();
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-sm font-extrabold tracking-widest">
          AVCLUB
        </Link>
        <p className="mt-6 text-sm font-semibold text-accent">Thu, Oct 16 · 4:00 PM</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">AVCLUB PILOT</h1>
        <p className="mt-1 text-muted">The Breakbeat, Chico</p>
        {isPending ? (
          <p className="mt-6 text-sm text-muted">Checking your account.</p>
        ) : !user ? (
          <p className="mt-6 text-sm">
            You're not signed in.{" "}
            <Link to="/login" className="font-semibold">
              Sign in
            </Link>{" "}
            to see your code.
          </p>
        ) : you ? (
          <div className="mt-6 rounded-2xl bg-surface p-5 shadow-border">
            <p className="text-sm text-muted">@{user.displayName ?? user.primaryEmail ?? "you"}</p>
            <p className="mt-2 text-2xl font-extrabold">{you.name}</p>
            <p className="mt-4 text-sm text-muted">Code</p>
            <p className="text-5xl font-extrabold tracking-widest tabular-nums">{you.code}</p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Register first. Your code shows up here.</p>
        )}
      </div>
    </main>
  );
}
