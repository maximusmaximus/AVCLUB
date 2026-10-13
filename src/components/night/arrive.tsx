import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button, fieldClass } from "@/components/night/ui";
import { joinInterestList } from "@/lib/interest";

const SEEN = "avclub-briefing";

const NIGHT = [
  { title: "Check-in", text: "Meet the stewards and the room." },
  { title: "Meet and greet", text: "Find the people you will build with." },
  { title: "Show and tell", text: "Share what you have already started." },
  { title: "Build", text: "Make the work before you leave." },
  { title: "Review", text: "Walk what got made. The room ranks it." },
  { title: "Awards", text: "The judge speaks after the room." },
];

export function Briefing() {
  const [step, setStep] = useState<0 | 1 | null>(0);
  const titleId = useId();
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN) === "1") setStep(null);
  }, []);

  useEffect(() => {
    if (step === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    actionRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [step]);

  if (step === null) return null;

  function dismiss() {
    sessionStorage.setItem(SEEN, "1");
    setStep(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/85 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6"
      >
        <p className="text-xs font-extrabold tracking-widest text-accent uppercase">
          {step === 0 ? "1 of 2" : "2 of 2"}
        </p>
        {step === 0 ? (
          <>
            <h2 id={titleId} className="mt-3 text-2xl font-extrabold tracking-tight">
              What is Audio Visual Club?
            </h2>
            <p className="mt-3 text-pretty text-muted">
              A night for people who work with light, sound, film, and machines. You show a piece, find a team, and make something before you leave.
            </p>
            <Button ref={actionRef} className="mt-6 w-full" onClick={() => setStep(1)}>
              Next
            </Button>
          </>
        ) : (
          <>
            <h2 id={titleId} className="mt-3 text-2xl font-extrabold tracking-tight">
              Share it. Then build it.
            </h2>
            <p className="mt-3 text-pretty text-muted">
              Bridge analog and digital, and share what you are making. The point of the night is to actually build.
            </p>
            <ol className="mt-5 divide-y divide-line">
              {NIGHT.map((phase) => (
                <li key={phase.title} className="py-2.5">
                  <span className="font-extrabold">{phase.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{phase.text}</span>
                </li>
              ))}
            </ol>
            <Button ref={actionRef} className="mt-6 w-full" onClick={dismiss}>
              Dismiss
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function StayUpdated() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

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
    <>
      <button
        type="button"
        onClick={() => {
          setStatus("idle");
          setError("");
          setOpen(true);
        }}
        className="tap shrink-0 text-sm font-semibold text-accent underline-offset-4 hover:underline"
      >
        Stay updated
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-bg/85 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-2xl font-extrabold tracking-tight">
                Stay updated
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="tap inline-flex min-h-11 items-center text-sm font-semibold text-muted"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-pretty text-muted">Leave an email. We'll write when the next night is set.</p>
            {status === "done" ? (
              <p className="mt-6 text-lg font-semibold" role="status">
                You're on the list. We'll email this address.
              </p>
            ) : (
              <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
                <label>
                  <span className="sr-only">Email</span>
                  <input
                    id="stay-email"
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
          </div>
        </div>
      )}
    </>
  );
}
