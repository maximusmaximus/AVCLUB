import { Link } from "@tanstack/react-router";
import { Button } from "@/components/night/ui";
import { CALENDAR_PAGE } from "@/lib/night/calendar";
import { phaseById } from "@/lib/night/model";
import { SECTIONS } from "@/lib/night/sections";
import { useNight, youPerson } from "@/lib/night/store";

export function EventView({ canRegister }: { canRegister: boolean }) {
  const setSurface = useNight((s) => s.setSurface);
  const you = useNight(youPerson);

  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="text-sm font-extrabold tracking-widest text-accent uppercase">First event</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">AVCLUB PILOT</h1>
      <p className="mt-3 text-lg font-semibold">Thu, Oct 16 · 4:00–7:15 PM</p>
      <p className="mt-1 text-muted">The Breakbeat, 112 W 2nd St, Chico</p>
      <p className="mt-4 text-pretty text-muted">
        A night for people who work with light, sound, film, and machines. You show a piece, find a team, and make something before you leave. The point is to actually build.
      </p>
      <ol className="mt-8 divide-y divide-line">
        {SECTIONS.map((section) => (
          <li key={section.slug} className="grid grid-cols-[4.5rem_1fr] gap-3 py-3">
            <span className="pt-0.5 text-sm font-extrabold text-accent tabular-nums">{section.starts}</span>
            <Link to="/e/$slug" params={{ slug: section.slug }}>
              <span className="block font-extrabold">{phaseById(section.phase).title}</span>
              <span className="mt-0.5 block text-sm text-muted">{section.action}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-muted">Entry is $20. 18+.</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {canRegister ? (
          <Button className="sm:min-w-40" onClick={() => setSurface("join")}>
            {you ? "Your pass" : "Register"}
          </Button>
        ) : (
          <Link
            to="/login"
            className="tap inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            Sign in to register
          </Link>
        )}
        <a
          href={CALENDAR_PAGE}
          target="_blank"
          rel="noreferrer"
          className="tap inline-flex min-h-11 items-center justify-center rounded-lg bg-surface px-4 text-sm font-semibold shadow-border"
        >
          Calendar
        </a>
      </div>
    </div>
  );
}
