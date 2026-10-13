import { useState, type ReactNode } from "react";
import { chooseProfileVisibility } from "@/lib/access";
import { notifyAccess } from "@/components/night/use-access";
import type { AccessSnapshot } from "@/lib/access";
import { Button } from "@/components/night/ui";

export function VisibilityGate({
  access,
  signedIn,
  children,
}: {
  access: AccessSnapshot | null;
  signedIn: boolean;
  children: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ask = Boolean(signedIn && access && !access.visibilitySet);

  async function choose(isPublic: boolean) {
    setError("");
    setPending(true);
    try {
      await chooseProfileVisibility({ data: { isPublic } });
      notifyAccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save that.");
    } finally {
      setPending(false);
    }
  }

  if (!ask) return <>{children}</>;

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="w-full max-w-md">
        <p className="text-sm font-extrabold tracking-widest">AVCLUB</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Make this profile public?</h1>
        <p className="mt-2 text-pretty text-sm text-muted">
          Public shows your name, ticket, check-in, submissions, and roles. Private stays on this account. You can change it later.
        </p>
        <div className="mt-6 grid gap-2">
          <Button disabled={pending} onClick={() => void choose(true)}>
            Public
          </Button>
          <Button variant="ghost" disabled={pending} onClick={() => void choose(false)}>
            Private
          </Button>
        </div>
        {error && (
          <p className="mt-3 text-sm font-semibold text-accent" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
