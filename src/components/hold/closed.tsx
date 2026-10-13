import { useState, type FormEvent } from "react";
import { Button, fieldClass } from "@/components/night/ui";
import { joinInterestList } from "@/lib/interest";
import { GrantsButton } from "@/components/night/grants";
import { CALENDAR_PAGE } from "@/lib/night/calendar";

const PHASES = [
  { title: "Check-in", text: "The door opens. You meet the stewards and the room." },
  { title: "Meet and greet", text: "Find the people you will build with." },
  { title: "Show and tell", text: "Share what you have already started. Short, out loud." },
  { title: "Build", text: "The long part of the night. Make the work in the room." },
  { title: "Review", text: "Walk what got made, then rank it. The room sees the order." },
  { title: "Awards", text: "The judge speaks after the room." },
];

export function ClosedDoor() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
      setError("Use a real email.");
      return;
    }
    setError("");
    setStatus("saving");
    try {
      await joinInterestList({ data: { email: next } });
      setStatus("done");
    } catch {
      setStatus("idle");
      setError("Couldn't save that. Try again.");
    }
  }

  return (
    <div className="scroll-smooth bg-bg text-fg motion-reduce:scroll-auto">
      <header className="flex items-center justify-between px-6 pt-8">
        <p className="text-sm font-extrabold tracking-widest">AVCLUB</p>
        <GrantsButton />
      </header>

      <main>
        <section className="mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-lg flex-col justify-center px-6 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-balance sm:text-6xl">
            Still running cable.
          </h1>
          <p className="mt-4 text-2xl font-semibold text-muted">Share Ideas and Build</p>
          <p className="mt-3 max-w-md text-pretty text-muted">
            The door isn't open. Leave an email and we'll write when it is.
          </p>

          {status === "done" ? (
            <p className="mt-8 text-lg font-semibold text-fg" role="status">
              You're on the list. We'll email this address.
            </p>
          ) : (
            <form className="mt-8 flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Email</span>
                <input
                  className={fieldClass}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@studio.com"
                  value={email}
                  maxLength={254}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <Button type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Saving" : "Tell me when"}
              </Button>
            </form>
          )}
          {error && (
            <p className="mt-3 text-sm font-semibold text-accent" role="alert">
              {error}
            </p>
          )}

          <h2 className="mt-10 text-lg font-extrabold tracking-tight">What is Audio Visual Club?</h2>
          <p className="mt-2 max-w-md text-pretty text-muted">
            A night for people who work with light, sound, film, and machines. You show a piece, you find a team, and you make something before you leave.
          </p>
          <a href="#the-night" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-fg">
            Read more
          </a>
        </section>

        <section id="the-night" className="mx-auto w-full max-w-lg scroll-mt-10 px-6 pb-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-balance">Bridge it. Share it. Build it.</h2>
          <p className="mt-4 max-w-md text-pretty text-lg text-fg">
            Audio Visual Club gets people to bridge analog and digital, and to share what they are making. The point of the night is to actually build.
          </p>
          <ol className="mt-10 divide-y divide-line">
            {PHASES.map((phase, index) => (
              <li key={phase.title} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4">
                <span className="pt-0.5 text-sm font-extrabold text-accent tabular-nums">{index + 1}</span>
                <span>
                  <span className="block font-extrabold">{phase.title}</span>
                  <span className="mt-1 block text-pretty text-muted">{phase.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <a
            href={CALENDAR_PAGE}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-muted"
          >
            The night, on the calendar
          </a>
        </section>
      </main>
    </div>
  );
}
