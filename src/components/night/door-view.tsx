import { useMemo, useState } from "react";
import { Button, fieldClass } from "@/components/night/ui";
import { InfoMark } from "@/components/night/info";
import { cn } from "@/lib/cn";
import { markCheckedIn } from "@/lib/access";
import { phaseById, ticketLabel } from "@/lib/night/model";
import { useNight } from "@/lib/night/store";

export function DoorView() {
  const people = useNight((s) => s.people);
  const checkIn = useNight((s) => s.checkIn);
  const phase = useNight((s) => s.clock.phase);
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [codeConsent, setCodeConsent] = useState(false);
  const [codeMsg, setCodeMsg] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [decision, setDecision] = useState<{ id: string; code: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => Number(a.checkedIn) - Number(b.checkedIn) || a.name.localeCompare(b.name));
  }, [people, query]);

  const person = people.find((p) => p.id === selected) ?? null;
  const meta = phaseById(phase);
  const inCount = people.filter((p) => p.checkedIn).length;

  function finish(call: "build" | "watch") {
    if (!decision) return;
    checkIn(decision.id, call);
    void markCheckedIn({ data: { code: decision.code, call } }).catch(() => undefined);
    setCodeMsg(`${decision.name} is in. ${call === "build" ? "They can build." : "Watch only."}`);
    setDecision(null);
    setCode("");
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_18rem]">
      <section>
        <p className="text-sm font-semibold text-accent">Steward door · {meta.title}</p>
        <div className="mt-2 flex items-start justify-between gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-fg">Who is coming in</h1>
          <InfoMark
            id="door"
            side="right"
            text="Type their code. Then decide if they can build or only watch."
          />
        </div>
        <p className="mt-3 text-sm tabular-nums text-muted">
          {inCount} of {people.length} checked in
        </p>
        <label className="mt-4 block">
          <span className="sr-only">Search the list</span>
          <input
            className={fieldClass}
            value={query}
            placeholder="Search name or code"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl shadow-border">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(p.id);
                  setConsent(p.consent);
                }}
                className={cn(
                  "flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left",
                  selected === p.id ? "bg-surface-2" : "bg-surface",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-fg">{p.name}</span>
                  <span className="block text-sm text-muted">{ticketLabel(p.ticket)}</span>
                </span>
                <span className={cn("shrink-0 text-sm font-semibold", p.checkedIn ? "text-accent" : "text-muted")}>
                  {p.checkedIn ? (p.canBuild ? "Building" : "Watching") : "Waiting"}
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="bg-surface px-4 py-6 text-sm text-muted">No one matches.</li>}
        </ul>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <form
          className="rounded-2xl bg-surface p-4 shadow-border"
          onSubmit={(e) => {
            e.preventDefault();
            const normalized = code.trim().toUpperCase();
            const match = people.find((p) => p.code === normalized);
            if (!match) {
              setCodeMsg("No one on tonight's list has that code.");
              return;
            }
            if (match.checkedIn) {
              setCodeMsg(`${match.name} is already in.`);
              return;
            }
            if (!codeConsent) return;
            setDecision({ id: match.id, code: match.code, name: match.name });
          }}
        >
          <label className="block text-sm font-semibold text-fg">
            Event code
            <input
              className={cn(fieldClass, "mt-2 tracking-widest uppercase")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              placeholder="CODE"
            />
          </label>
          <label className="mt-3 flex min-h-11 items-start gap-3 text-sm text-fg">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-accent"
              checked={codeConsent}
              onChange={(e) => setCodeConsent(e.target.checked)}
            />
            <span>They consent to photos and recording.</span>
          </label>
          <Button type="submit" className="mt-3 w-full" disabled={code.trim().length < 4 || !codeConsent}>
            Check in code
          </Button>
          {codeMsg && (
            <p className="mt-2 text-sm text-muted" role="status">
              {codeMsg}
            </p>
          )}
        </form>

        <div className="rounded-2xl bg-surface p-4 shadow-border">
          {person ? (
            <>
              <h2 className="text-xl font-extrabold text-fg">{person.name}</h2>
              <p className="mt-1 text-sm tracking-widest text-muted tabular-nums">{person.code}</p>
              {person.checkedIn ? (
                <p className="mt-3 text-sm text-pretty text-muted">
                  Already in. {person.canBuild ? "Cleared to build." : "Watch only."} Deposit returns.
                </p>
              ) : (
                <>
                  <label className="mt-4 flex min-h-11 items-start gap-3 text-sm text-fg">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-accent"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>Consent to photos and recording tonight.</span>
                  </label>
                  <Button
                    className="mt-3 w-full"
                    disabled={!consent}
                    onClick={() => setDecision({ id: person.id, code: person.code, name: person.name })}
                  >
                    Check in {person.name.split(" ")[0]}
                  </Button>
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">Select a name.</p>
          )}
        </div>
      </aside>

      {decision && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-bg/80 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-border" role="dialog" aria-modal="true">
            <h2 className="text-2xl font-extrabold">{decision.name}</h2>
            <p className="mt-2 text-sm text-pretty text-muted">
              If they are late, you decide whether they can build.
            </p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => finish("build")}>They can build</Button>
              <Button variant="ghost" onClick={() => finish("watch")}>
                Watch only
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
