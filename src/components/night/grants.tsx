import { useEffect, useId, useState, type FormEvent } from "react";
import { Button, fieldClass } from "@/components/night/ui";
import { applyForGrant } from "@/lib/grants";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";

export function GrantsButton() {
  const titleId = useId();
  const { user } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [work, setWork] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName((current) => current || user?.displayName?.trim() || "");
    setEmail((current) => current || user?.primaryEmail?.trim() || "");
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await applyForGrant({ data: { name, email, work } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save that.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDone(false);
          setError("");
          setOpen(true);
        }}
        className="tap shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-extrabold text-accent-fg"
      >
        Grants Available!
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
                Grant tickets
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tap inline-flex min-h-11 items-center text-sm font-semibold text-muted"
              >
                Close
              </button>
            </div>
            {done ? (
              <p className="mt-4 text-sm text-pretty" role="status">
                Application saved. If you get a grant ticket, the Grant Code arrives at {email}.
              </p>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={onSubmit}>
                <p className="text-sm text-pretty text-muted">
                  We can cover a ticket to the night. Tell us what you're making with audio or video. You'll be emailed only if you're accepted.
                </p>
                <label className="block">
                  <span className="text-sm font-semibold">Name</span>
                  <input className={cn(fieldClass, "mt-2")} value={name} maxLength={48} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Email</span>
                  <input
                    type="email"
                    className={cn(fieldClass, "mt-2")}
                    value={email}
                    maxLength={254}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">What are you working on?</span>
                  <textarea
                    className="mt-2 min-h-28 w-full rounded-lg border border-line bg-bg px-3 py-3 text-base text-fg outline-none placeholder:text-muted focus-visible:border-accent"
                    value={work}
                    maxLength={400}
                    placeholder="Audio, video, or both."
                    onChange={(e) => setWork(e.target.value)}
                  />
                </label>
                {error && (
                  <p className="text-sm font-semibold text-accent" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Sending" : "Apply"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
