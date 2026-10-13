import { useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { joinInterestList } from "@/lib/interest";
import { phaseById } from "@/lib/night/model";
import { sectionBySlug } from "@/lib/night/sections";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button, fieldClass } from "@/components/night/ui";

export const Route = createFileRoute("/e/$slug")({
  component: SectionPage,
  head: ({ params }) => {
    const section = sectionBySlug(params.slug);
    const title = section ? `${phaseById(section.phase).title} — AVCLUB PILOT` : "AVCLUB PILOT";
    const description = section?.action ?? "A night to share ideas and build.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
    };
  },
});

function SectionPage() {
  const { slug } = Route.useParams();
  const section = sectionBySlug(slug);
  const { user, isPending } = useCurrentUserState();

  if (!section) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
        <div>
          <h1 className="text-3xl font-extrabold">That part of the night isn't on the card.</h1>
          <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold">
            Back
          </Link>
        </div>
      </main>
    );
  }

  const phase = phaseById(section.phase);

  return (
    <main className="min-h-dvh bg-bg px-4 py-8 text-fg">
      <div className="mx-auto w-full max-w-lg">
        <Link to="/" className="text-sm font-extrabold tracking-widest">
          AVCLUB
        </Link>
        <p className="mt-6 text-sm font-semibold text-accent">{section.starts} · AVCLUB PILOT</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{phase.title}</h1>
        <p className="mt-3 text-pretty text-muted">{section.action}</p>
        {isPending ? (
          <p className="mt-8 text-sm text-muted">Checking your account.</p>
        ) : user ? (
          <Link
            to="/"
            className="tap mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            Open your night
          </Link>
        ) : (
          <EmailWall />
        )}
      </div>
    </main>
  );
}

function EmailWall() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await joinInterestList({ data: { email } });
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save that.");
    }
  }

  return (
    <div className="mt-8 rounded-2xl bg-surface p-5 shadow-border">
      <h2 className="text-xl font-extrabold">You're not signed in.</h2>
      <p className="mt-2 text-sm text-pretty text-muted">
        This page is a share of the night. Leave your email and you'll hear when the next event is set.
      </p>
      {done ? (
        <p className="mt-4 text-sm font-semibold">You're on the list. We'll email this address.</p>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <input
            className={fieldClass}
            type="email"
            required
            value={email}
            placeholder="you@email.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Tell me about the next event
          </Button>
          {error && <p className="text-sm font-semibold text-accent">{error}</p>}
        </form>
      )}
      <Link to="/login" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-muted">
        Sign in
      </Link>
    </div>
  );
}
