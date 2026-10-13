import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/night/ui";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [{ title: "Sign in — AVCLUB" }],
  }),
});

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="w-full max-w-sm">
        <p className="text-sm font-extrabold tracking-widest">AVCLUB</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-2 text-pretty text-sm text-muted">
          Sign in to register. After that, you only see the parts of the night you're allowed into.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((provider) => (
              <Button
                key={provider.providerId}
                variant={provider.idp === "google" ? "primary" : "ghost"}
                onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
              >
                Continue with {provider.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is off.</p>
          )}
        </div>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-muted">
          Back to the night
        </Link>
      </div>
    </main>
  );
}
