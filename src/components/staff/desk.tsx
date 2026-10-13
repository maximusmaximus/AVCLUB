import { useEffect, useState, type FormEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { GROK_PROVIDERS, signIn, signOut } from "@/lib/auth/client";
import { Button, fieldClass } from "@/components/night/ui";
import { FloorView } from "@/components/night/floor-view";
import { Invites } from "@/components/staff/invites";
import { AccessGrants } from "@/components/staff/access";
import { GrantDesk } from "@/components/staff/grant-desk";
import { InfoProvider } from "@/components/night/info";
import { cn } from "@/lib/cn";
import { EVENT, PHASES, TICKETS, formatScheduled, type Surface } from "@/lib/night/model";
import { CALENDAR_PAGE } from "@/lib/night/calendar";
import { saveNightSnapshot } from "@/lib/night-record";
import { loadMailStatus, syncNightMail } from "@/lib/mail";
import { useNight } from "@/lib/night/store";
import { addDeskAdmin, removeDeskAdmin, saveStripeKey, setSiteLive, staffDesk, staffSignOut } from "@/lib/staff";

type DeskData = Awaited<ReturnType<typeof staffDesk>>;

const WAYS: { id: Surface; title: string; detail: string }[] = [
  { id: "join", title: "Join", detail: "Tickets, terms, and a door code." },
  { id: "door", title: "Door", detail: "Check people in. Consent happens here." },
  { id: "floor", title: "Floor", detail: "Start, pause, skip, and set the pace." },
  { id: "phone", title: "Phone", detail: "What a builder has in their hand." },
  { id: "room", title: "Room", detail: "The projector. The vote shows up here." },
];

export function StaffDesk({ initial }: { initial: DeskData }) {
  const router = useRouter();
  const [desk, setDesk] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!desk.signedIn) {
    return <SignIn account={desk.account} />;
  }

  return (
    <InfoProvider>
      <Desk
        desk={desk}
        error={error}
        pending={pending}
        onLive={async (live) => {
          setError("");
          setPending(true);
          try {
            const next = await setSiteLive({ data: { live } });
            setDesk((current) => ({ ...current, live: next.live }));
            await router.invalidate();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't switch the door.");
          } finally {
            setPending(false);
          }
        }}
        onSignOut={async () => {
          setPending(true);
          try {
            await staffSignOut();
            await signOut("/staff");
          } finally {
            setPending(false);
          }
        }}
      />
    </InfoProvider>
  );
}

function StripeKey({ initialOn, initialLast4 }: { initialOn: boolean; initialLast4: string | null }) {
  const [on, setOn] = useState(initialOn);
  const [last4, setLast4] = useState(initialLast4);
  const [secret, setSecret] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function save(next: string) {
    setError("");
    setNote("");
    setPending(true);
    try {
      const saved = await saveStripeKey({ data: { secret: next } });
      setOn(saved.on);
      setLast4(saved.last4);
      setSecret("");
      setNote(saved.on ? "Key saved. Checkout uses this one." : "Card checkout is off.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save that key.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold">Payments</h2>
      <p className="mt-1 text-sm text-muted">
        {on && last4 ? `Stripe is on. Key ending ${last4}.` : "No Stripe key saved."} The full key is never shown again.
      </p>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void save(secret);
        }}
      >
        <input
          type="password"
          autoComplete="off"
          className={fieldClass}
          placeholder="sk_live_…"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
        <Button type="submit" disabled={pending || secret.trim().length < 20}>
          {pending ? "Saving" : "Save key"}
        </Button>
      </form>
      {on && (
        <Button variant="ghost" className="mt-2" disabled={pending} onClick={() => void save("")}>
          Remove key
        </Button>
      )}
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}
      {error && (
        <p className="mt-2 text-sm font-semibold text-accent" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function SignIn({ account }: { account: string | null }) {
  const google = GROK_PROVIDERS.find((provider) => provider.idp === "google");
  return (
    <div className="flex min-h-dvh flex-col bg-bg px-6 py-8 text-fg">
      <header className="flex items-center justify-between">
        <p className="text-sm font-extrabold tracking-widest">AVCLUB STAFF</p>
        <Link to="/" className="text-sm font-semibold text-muted">
          Back
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Staff</h1>
        {account ? (
          <p className="mt-2 text-sm text-muted">{account} is signed in, but it is not an admin.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">Sign in with the admin Google account.</p>
            {google && (
              <Button className="mt-6 w-full" onClick={() => signIn(google.providerId, { callbackURL: "/staff" })}>
                Continue with Google
              </Button>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Desk({
  desk,
  error,
  pending,
  onLive,
  onSignOut,
}: {
  desk: DeskData;
  error: string;
  pending: boolean;
  onLive: (live: boolean) => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const people = useNight((s) => s.people);
  const talks = useNight((s) => s.talks);
  const ballot = useNight((s) => s.ballot);
  const setSurface = useNight((s) => s.setSurface);
  const [folded, setFolded] = useState("");
  const [folding, setFolding] = useState(false);

  useEffect(() => {
    void useNight.persist.rehydrate();
  }, []);

  return (
    <div className="min-h-dvh bg-bg px-4 py-6 text-fg sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold tracking-widest">AVCLUB STAFF</p>
            <p className="mt-1 text-sm text-muted">{desk.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-muted">
              Site
            </Link>
            <Button variant="ghost" disabled={pending} onClick={() => void onSignOut()}>
              Sign out
            </Button>
          </div>
        </header>

        <section className="mt-8">
          <h1 className="text-3xl font-extrabold tracking-tight">The door</h1>
          <p className="mt-1 text-sm text-muted">
            {desk.live ? "Visitors land in the night." : "Visitors see the closed door and can leave an email."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Site mode">
            <ModeButton
              pressed={!desk.live}
              disabled={pending}
              onClick={() => void onLive(false)}
              label="Under construction"
            />
            <ModeButton pressed={desk.live} disabled={pending} onClick={() => void onLive(true)} label="Live" />
          </div>
          {error && (
            <p className="mt-3 text-sm font-semibold text-accent" role="alert">
              {error}
            </p>
          )}
          <p className="mt-3 text-sm text-muted">While you're signed in, the night still opens from here even if the public door is closed.</p>
        </section>

        <StripeKey initialOn={desk.stripeOn} initialLast4={desk.stripeLast4} />

        <AccessGrants />

        <GrantDesk />

        {desk.owner && <Admins initial={desk.admins} />}

        <Invites />

        <MailQueue />

        <section className="mt-10">
          <h2 className="text-xl font-extrabold">Run the night</h2>
          <div className="mt-3 grid gap-2">
            {WAYS.map((way) => (
              <Link
                key={way.id}
                to="/night"
                onClick={() => setSurface(way.id)}
                className="flex min-h-16 items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-border"
              >
                <span>
                  <span className="block font-extrabold">{way.title}</span>
                  <span className="block text-sm text-muted">{way.detail}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-accent">Open</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-surface p-4 shadow-border sm:p-6">
          <FloorView />
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-extrabold">Tonight's list</h2>
          <p className="mt-1 text-sm text-muted">Codes on this device. The door uses them.</p>
          <ul className="mt-3 divide-y divide-line rounded-xl bg-surface shadow-border">
            {people.map((person) => {
              const ticket = TICKETS.find((item) => item.id === person.ticket);
              return (
                <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{person.name}</span>
                    <span className="block text-sm text-muted">{ticket?.name ?? person.ticket}</span>
                  </span>
                  <span className="font-extrabold tracking-widest">{person.code}</span>
                  <span className={cn("w-8 text-right text-sm font-semibold", person.checkedIn ? "text-fg" : "text-muted")}>
                    {person.checkedIn ? "In" : "Out"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-extrabold">Calendar</h2>
          <p className="mt-1 text-sm text-muted">
            Every section is on the public AVCLUB calendar. Folding writes what was shared, the review order, and who was in the room. Door codes and emails stay off it.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={CALENDAR_PAGE}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg bg-surface px-4 text-sm font-semibold text-fg shadow-border"
            >
              Open the calendar
            </a>
            <Button
              variant="ghost"
              disabled={folding}
              onClick={() => {
                const order = new Map(talks.map((talk) => [talk.id, talk]));
                const presented = ballot.map((id) => order.get(id)).filter((talk) => talk != null);
                void (async () => {
                  setFolding(true);
                  try {
                    const saved = await saveNightSnapshot({
                      data: {
                        presented: presented.map((talk) => ({ title: talk.title, team: talk.team, blurb: talk.blurb })),
                        ranking: presented.map((talk) => talk.title),
                        attendees: people
                          .filter((person) => person.checkedIn)
                          .map((person) => ({
                            name: person.name,
                            ticket: TICKETS.find((item) => item.id === person.ticket)?.name ?? person.ticket,
                          })),
                      },
                    });
                    setFolded(
                      saved.presented.length === 0
                        ? "Folded. Nothing was on the board."
                        : `Folded ${saved.presented.length} pieces for ${saved.nightOn}.`,
                    );
                  } catch (err) {
                    setFolded(err instanceof Error ? err.message : "Couldn't fold the night.");
                  } finally {
                    setFolding(false);
                  }
                })();
              }}
            >
              Fold this night in
            </Button>
          </div>
          {folded && <p className="mt-3 text-sm font-semibold">{folded}</p>}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-extrabold">The night</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <Fact label="Venue" value={EVENT.venue} />
            <Fact label="Starts" value={EVENT.startsLabel} />
            {EVENT.sponsor && <Fact label="Sponsor" value={EVENT.sponsor} />}
            {EVENT.judge && <Fact label="Judge" value={EVENT.judge} />}
            {EVENT.pairingCode && <Fact label="Pairing" value={EVENT.pairingCode} />}
          </dl>
          <ol className="mt-4 divide-y divide-line rounded-xl bg-surface shadow-border">
            {PHASES.map((phase) => (
              <li key={phase.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <span className="font-semibold">{phase.title}</span>
                <span className="shrink-0 text-sm text-muted">{formatScheduled(phase.durationSec)}</span>
              </li>
            ))}
          </ol>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {TICKETS.map((ticket) => (
              <li key={ticket.id} className="rounded-xl bg-surface px-4 py-3 shadow-border">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-extrabold">{ticket.name}</span>
                  <span className="font-semibold text-accent">{ticket.price}</span>
                </span>
                <span className="mt-1 block text-sm text-muted">{ticket.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 pb-8">
          <h2 className="text-xl font-extrabold">Emails</h2>
          <p className="mt-1 text-sm text-muted">
            {desk.signups.length === 0 ? "No one has asked yet." : `${desk.signups.length} on the list.`}
          </p>
          {desk.signups.length > 0 && (
            <ul className="mt-3 divide-y divide-line rounded-xl bg-surface shadow-border">
              {desk.signups.map((row) => (
                <li key={row.email} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                  <span className="font-semibold">{row.email}</span>
                  <span className="text-sm text-muted">{row.signedUpAt}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function MailQueue() {
  const [line, setLine] = useState("Checking mail.");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    try {
      const flush = await syncNightMail();
      const status = await loadMailStatus();
      const waiting = status.unsent === 0 ? "Nothing waiting." : `${status.unsent} waiting.`;
      const just = flush.sent > 0 ? `Sent ${flush.sent}. ` : "";
      const held = flush.held > 0 ? " Gmail isn't ready on this session yet." : "";
      const problem = status.lastError && status.unsent > 0 ? ` ${status.lastError}` : "";
      setLine(`${just}${waiting}${held}${problem} ${status.sent} already sent.`);
    } catch (err) {
      setLine(err instanceof Error ? err.message : "Couldn't reach mail.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void send();
  }, []);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold">Email</h2>
      <p className="mt-1 text-sm text-muted">
        Notes go out from the Gmail connected here. The 15-minute reminder follows the clock. Parts of the night follow the floor phone, so a pause or a skip moves the note.
      </p>
      <p className="mt-3 text-sm font-semibold" role="status">
        {line}
      </p>
      <Button className="mt-3" variant="ghost" disabled={busy} onClick={() => void send()}>
        {busy ? "Sending" : "Send queued mail"}
      </Button>
    </section>
  );
}

function Admins({ initial }: { initial: string[] }) {
  const [admins, setAdmins] = useState(initial);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await addDeskAdmin({ data: { email } });
      setAdmins(result.admins);
      setEmail("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't add that admin.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold">Admins</h2>
      <p className="mt-1 text-sm text-muted">Another Google account gets the same desk. They sign in with that email.</p>
      <form className="mt-4 flex gap-2" onSubmit={onSubmit}>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Admin email</span>
          <input
            className={fieldClass}
            type="email"
            value={email}
            placeholder="name@gmail.com"
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding" : "Add"}
        </Button>
      </form>
      {error && (
        <p className="mt-3 text-sm font-semibold text-accent" role="alert">
          {error}
        </p>
      )}
      <ul className="mt-3 divide-y divide-line rounded-xl bg-surface shadow-border">
        {admins.map((admin) => (
          <li key={admin} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0 truncate font-semibold">{admin}</span>
            {admin === "maxinfeld@gmail.com" ? (
              <span className="text-sm text-muted">Owner</span>
            ) : (
              <Button
                variant="ghost"
                onClick={() => {
                  void removeDeskAdmin({ data: { email: admin } })
                    .then((result) => setAdmins(result.admins))
                    .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Couldn't remove that admin."));
                }}
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ModeButton({
  pressed,
  disabled,
  onClick,
  label,
}: {
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "tap min-h-12 rounded-lg px-3 text-sm font-semibold disabled:opacity-40",
        pressed ? "bg-accent text-accent-fg" : "bg-surface text-fg shadow-border",
      )}
    >
      {label}
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-3 shadow-border">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-extrabold">{value}</dd>
    </div>
  );
}
