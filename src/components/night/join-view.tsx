import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Button, fieldClass } from "@/components/night/ui";
import { InfoMark } from "@/components/night/info";
import { enableAlerts } from "@/components/night/alerts";
import { ShowCardForm } from "@/components/night/show-card";
import { cn } from "@/lib/cn";
import { EVENT, TICKETS, makeCode, type PayMethod, type PayWhen, type TicketKind } from "@/lib/night/model";
import { useNight, youPerson } from "@/lib/night/store";
import { finishEntryCheckout, loadMyProfile, recordNightJoin, startEntryCheckout } from "@/lib/access";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { notifyAccess, useNightAccess } from "@/components/night/use-access";
import { previewInvite } from "@/lib/invite-actions";
import { coversTicket, money, ticketDue, ticketScopeLabel, type InviteTicket } from "@/lib/invites";

const TERMS = [
  { id: "age", label: "I am 18 or older." },
  { id: "grace", label: "If I am late, the door decides whether I can build." },
] as const;

function nightDate(): Date {
  return new Date(2026, 9, 16, 16, 0, 0);
}

export function JoinView() {
  const join = useNight((s) => s.join);
  const you = useNight(youPerson);
  const people = useNight((s) => s.people);
  const setSurface = useNight((s) => s.setSurface);
  const { access } = useNightAccess();
  const [when, setWhen] = useState("Thursday");
  const [payNote, setPayNote] = useState("");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("checkout");
    if (!sessionId) return;
    window.history.replaceState({}, "", "/night");
    if (sessionId === "cancel") {
      setPayNote("Payment was not completed. You are not on the list.");
      return;
    }
    void finishEntryCheckout({ data: { sessionId } })
      .then((result) => {
        sessionStorage.setItem("avclub-code-mailed", result.mailed ? "1" : "0");
        notifyAccess();
        join({
          name: result.name,
          ticket: result.ticket,
          payWhen: "now",
          payMethod: "card",
          donation: result.donation,
          digest: null,
          profilePublic: result.profilePublic,
          code: result.code,
          inviteCode: result.inviteCode,
        });
      })
      .catch((caught: unknown) => {
        setPayNote(caught instanceof Error ? caught.message : "Payment was not accepted. You are not on the list.");
      });
  }, [join]);

  useEffect(() => {
    setWhen(format(nightDate(), "EEE, MMM d"));
  }, []);

  if (you) {
    const ticket = TICKETS.find((item) => item.id === you.ticket)?.name ?? "";
    return (
      <Pass
        name={you.name}
        code={you.code}
        ticket={ticket}
        onOpen={() => setSurface(you.ticket === "supporter" || you.ticket === "cosponsor" ? "room" : "phone")}
        openLabel={you.ticket === "supporter" || you.ticket === "cosponsor" ? "Open the room" : "Open your phone"}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="text-sm font-semibold text-accent">
        {when} · 4:00 PM · {EVENT.venue}
      </p>
      <div className="mt-2 flex items-start justify-between gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-balance">Share Ideas and Build</h1>
        <InfoMark id="night" side="right" text="Entry is $20. A code only changes the price." />
      </div>
      <button type="button" onClick={() => setSurface("event")} className="tap mt-3 text-sm font-semibold text-muted">
        About the night
      </button>
      <div className="mt-6">
        {payNote && (
          <p className="mb-3 text-sm font-semibold text-accent" role="alert">
            {payNote}
          </p>
        )}
        <Signup
          signedIn={Boolean(access?.signedIn)}
          onJoin={async (input) => {
            if (!access?.signedIn) {
              throw new Error("Sign in to finish. A Grant Code is optional.");
            }
            const code = makeCode(
              input.name,
              new Set(people.map((person) => person.code)),
            );
            if (input.method !== "code") {
              const checkout = await startEntryCheckout({
                data: {
                  name: input.name,
                  ticket: input.ticket,
                  profilePublic: input.profilePublic,
                  code,
                  donation: input.donation,
                  inviteCode: input.inviteCode,
                },
              });
              window.location.assign(checkout.url);
              return;
            }
            const result = await recordNightJoin({
              data: {
                name: input.name,
                ticket: input.ticket,
                profilePublic: input.profilePublic,
                code,
                donation: input.donation,
                method: input.method,
                inviteCode: input.inviteCode,
                last4: input.last4,
                expMonth: input.expMonth,
                expYear: input.expYear,
              },
            });
            sessionStorage.setItem("avclub-code-mailed", result.mailed ? "1" : "0");
            notifyAccess();
            join({ ...input, code, payWhen: "now", payMethod: input.method === "code" ? null : input.method });
          }}
        />
      </div>
    </div>
  );
}

function Pass({
  name,
  code,
  ticket,
  onOpen,
  openLabel,
}: {
  name: string;
  code: string;
  ticket: string;
  onOpen: () => void;
  openLabel: string;
}) {
  const [alerts, setAlerts] = useState("");
  const [mailed, setMailed] = useState(false);
  useEffect(() => {
    setMailed(sessionStorage.getItem("avclub-code-mailed") === "1");
  }, []);
  return (
    <div className="mx-auto w-full max-w-md">
      <p className="text-sm font-semibold text-accent">AVCLUB PILOT · Thu, Oct 16</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">You are on the list.</h1>
      <p className="mt-2 text-muted">
        {name} · {ticket}. Payment accepted. Show this code at the door.
      </p>
      <div className="mt-6 rounded-2xl bg-surface p-6 shadow-border">
        <p className="text-sm text-muted">Event code</p>
        <p className="mt-2 text-5xl font-extrabold tracking-widest tabular-nums">{code}</p>
      </div>
      {mailed && <p className="mt-3 text-sm text-muted">Also sent to your email.</p>}
      <ShowCardForm />
      <Button className="mt-4 w-full" onClick={onOpen}>
        {openLabel}
      </Button>
      <Button
        variant="ghost"
        className="mt-2 w-full"
        onClick={() => {
          void enableAlerts().then((ok) => setAlerts(ok ? "Alerts are on." : "Alerts stay off until the browser allows them."));
        }}
      >
        Alert me before the night
      </Button>
      {alerts && <p className="mt-2 text-sm text-muted">{alerts}</p>}
      <Link to="/ticket" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-muted">
        Open the ticket page
      </Link>
    </div>
  );
}

function Signup({
  signedIn,
  onJoin,
}: {
  signedIn: boolean;
  onJoin: (input: {
    name: string;
    ticket: TicketKind;
    payWhen: PayWhen;
    payMethod: PayMethod | null;
    donation: number;
    digest: boolean | null;
    profilePublic: boolean;
    inviteCode?: string | null;
    method: PayMethod | "code";
    last4?: string;
    expMonth?: number;
    expYear?: number;
  }) => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const { user } = useCurrentUserState();
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const [profilePublic, setProfilePublic] = useState(false);
  const [ticket, setTicket] = useState<TicketKind | null>(null);
  const [donation, setDonation] = useState("");
  const [digest, setDigest] = useState<boolean | null>(null);
  const [payMethod] = useState<PayMethod>("card");
  const [paying, setPaying] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [invite, setInvite] = useState<{ code: string; percent: number; ticket: InviteTicket } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    void loadMyProfile()
      .then((profile) => {
        if (cancelled) return;
        const fromProfile = profile.status === "open" ? profile.displayName.trim() : "";
        const fromAccount = user?.displayName?.trim() ?? "";
        const next = (fromProfile || fromAccount).slice(0, 48);
        if (next) setName((current) => (current.trim() ? current : next));
        if (profile.status === "open") setProfilePublic(profile.isPublic);
      })
      .catch(() => {
        if (cancelled) return;
        const fromAccount = user?.displayName?.trim().slice(0, 48) ?? "";
        if (fromAccount) setName((current) => (current.trim() ? current : fromAccount));
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, user]);

  const membership = ticket === "supporter" || ticket === "cosponsor";
  const donationValue = Number(donation || 0);
  const donationOk = donation.trim() === "" || (Number.isFinite(donationValue) && donationValue >= 0 && donationValue <= 500);
  const chosen = TICKETS.find((item) => item.id === ticket);
  const inviteFits = Boolean(ticket && invite && coversTicket(invite.ticket, ticket));
  const price = chosen ? (inviteFits && invite ? ticketDue(chosen.amount, invite.percent) : chosen.amount) : 0;
  const due = price + (donationOk ? Math.round(donationValue) : 0);
  const free = due === 0;

  function goPay() {
    if (!ticket) {
      setError("Pick how you are showing up.");
      return;
    }
    if (membership && digest === null) {
      setError("Say yes or no to the project digest.");
      return;
    }
    setError("");
    setStep(3);
  }

  async function confirm() {
    if (!ticket || !chosen) return;
    if (!donationOk) {
      setError("The extra amount is in dollars, up to $500.");
      return;
    }
    if (inviteInput.trim() && !invite) {
      setError("Apply the code, or clear it.");
      return;
    }
    if (invite && !inviteFits) {
      setError(`That code covers ${ticketScopeLabel(invite.ticket).toLowerCase()}.`);
      return;
    }
    setError("");
    setPaying(true);
    try {
      await onJoin({
        name,
        ticket,
        payWhen: "now",
        payMethod: free ? null : payMethod,
        donation: donationOk ? Math.round(donationValue) : 0,
        digest: membership ? digest : null,
        profilePublic,
        inviteCode: invite && inviteFits ? invite.code : null,
        method: free ? "code" : "card",
        last4: undefined,
        expMonth: undefined,
        expYear: undefined,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save that.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <form
      className="rounded-2xl bg-surface p-5 shadow-border"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 1) {
          if (name.trim().length < 2) {
            setError("Use the name the door should call.");
            return;
          }
          if (!TERMS.every((term) => agreed[term.id])) {
            setError("Agree to each line.");
            return;
          }
          setError("");
          setStep(2);
        } else if (step === 2) goPay();
        else void confirm();
      }}
    >
      <ol className="flex gap-3 text-xs font-semibold tracking-wide text-muted uppercase">
        {["You", "Ticket", "Pay"].map((label, i) => (
          <li key={label} className={cn(step === i + 1 && "text-accent")}>
            {i + 1} {label}
          </li>
        ))}
      </ol>
      {!signedIn && (
        <p className="mt-4 text-sm text-muted">
          A Grant Code is optional.{" "}
          <Link to="/login" className="font-semibold text-fg">
            Sign in
          </Link>{" "}
          to finish.
        </p>
      )}

      {step === 1 && (
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Name</span>
            <input className={cn(fieldClass, "mt-2")} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={48} />
          </label>
          <fieldset className="space-y-1">
            <legend className="text-sm font-semibold">What happens</legend>
            {TERMS.map((term) => (
              <label key={term.id} className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={Boolean(agreed[term.id])}
                  onChange={(e) => setAgreed((current) => ({ ...current, [term.id]: e.target.checked }))}
                />
                <span>{term.label}</span>
              </label>
            ))}
          </fieldset>
          <div>
            <p className="text-sm font-semibold">Profile</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Choice on={profilePublic} onClick={() => setProfilePublic(true)}>
                Public
              </Choice>
              <Choice on={!profilePublic} onClick={() => setProfilePublic(false)}>
                Private
              </Choice>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-5 space-y-3">
          {TICKETS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTicket(option.id)}
              className={cn(
                "tap flex min-h-11 w-full items-baseline justify-between gap-3 rounded-xl px-4 py-3 text-left shadow-border",
                ticket === option.id ? "bg-bg ring-2 ring-accent" : "bg-bg",
              )}
            >
              <span className="font-semibold">{option.name}</span>
              <span className="font-extrabold tabular-nums">
                {invite && coversTicket(invite.ticket, option.id) ? money(ticketDue(option.amount, invite.percent)) : option.price}
              </span>
            </button>
          ))}
          {membership && (
            <div className="grid grid-cols-2 gap-2">
              <Choice on={digest === true} onClick={() => setDigest(true)}>
                Email digest
              </Choice>
              <Choice on={digest === false} onClick={() => setDigest(false)}>
                No digest
              </Choice>
            </div>
          )}
          <label className="block text-sm font-semibold" htmlFor="invite-code">
            Grant Code
          </label>
          <div className="flex gap-2">
            <input
              id="invite-code"
              className={fieldClass}
              value={inviteInput}
              placeholder="Optional"
              autoCapitalize="characters"
              maxLength={12}
              onChange={(e) => {
                setInviteInput(e.target.value.toUpperCase());
                setInvite(null);
              }}
            />
            <Button
              variant="ghost"
              disabled={checking || inviteInput.trim().length < 4}
              onClick={() => {
                void (async () => {
                  setChecking(true);
                  setError("");
                  try {
                    const result = await previewInvite({ data: { code: inviteInput } });
                    if (!result.ok) {
                      setInvite(null);
                      setError(result.error);
                      return;
                    }
                    setInvite({ code: result.code, percent: result.percent, ticket: result.ticket });
                  } catch (err) {
                    setInvite(null);
                    setError(err instanceof Error ? err.message : "Couldn't check that code.");
                  } finally {
                    setChecking(false);
                  }
                })();
              }}
            >
              {checking ? "Checking" : "Apply"}
            </Button>
          </div>
          {invite && (
            <p className="text-sm">
              {invite.percent}% off · {ticketScopeLabel(invite.ticket)}
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-pretty">You pay {money(due)}.</p>
          <label className="block">
            <span className="text-sm font-semibold">Add an amount for future AV Club sessions</span>
            <span className="mt-0.5 block text-sm text-muted">Optional. It is added to what you pay.</span>
            <input
              inputMode="numeric"
              className={cn(fieldClass, "mt-2")}
              value={donation}
              placeholder="0"
              onChange={(e) => setDonation(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["5", "10", "20"].map((amount) => (
              <Choice key={amount} on={donation === amount} onClick={() => setDonation(donation === amount ? "" : amount)}>
                {`$${amount}`}
              </Choice>
            ))}
          </div>
          {free ? (
            <p className="text-sm">The code covers the ticket. You are not on the list until you finish.</p>
          ) : (
            <p className="text-sm text-muted">
              Card, Apple Pay, and Google Pay open on the payment page. You are not on the list until that payment is accepted.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm font-semibold text-accent" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        {step > 1 && (
          <Button type="button" variant="ghost" onClick={() => setStep((current) => (current === 3 ? 2 : 1))}>
            Back
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={paying}>
          {paying ? "Checking payment" : step === 3 ? (free ? "Use this code" : `Pay ${money(due)}`) : "Next"}
        </Button>
      </div>
    </form>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn("tap min-h-11 rounded-lg px-3 text-sm font-semibold", on ? "bg-accent text-accent-fg" : "bg-bg text-muted shadow-border")}
    >
      {children}
    </button>
  );
}
