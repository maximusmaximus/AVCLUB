import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { PhaseBanner } from "@/components/night/phase-banner";
import { InfoMark } from "@/components/night/info";
import { Button } from "@/components/night/ui";
import { useRemaining } from "@/components/night/use-clock";
import { ShowCardForm } from "@/components/night/show-card";
import { cn } from "@/lib/cn";
import { alignBallot, canSort, formatRemain, nextPhaseId, phaseById, ticketLabel, type Talk } from "@/lib/night/model";
import { saveMyRanking } from "@/lib/access";
import { ShareLink } from "@/components/night/share-link";
import { sectionForPhase } from "@/lib/night/sections";
import { useNight, youPerson } from "@/lib/night/store";

export function PhoneView({ embedded = false }: { embedded?: boolean }) {
  const you = useNight(youPerson);
  const clock = useNight((s) => s.clock);
  const talks = useNight((s) => s.talks);
  const ballot = useNight((s) => s.ballot);
  const setBallot = useNight((s) => s.setBallot);
  const setSurface = useNight((s) => s.setSurface);
  const remaining = useRemaining();
  const phase = phaseById(clock.phase);
  const upcoming = nextPhaseId(clock.phase);

  if (!you) {
    return (
      <div className={cn("mx-auto max-w-md", embedded && "p-4")}>
        <h2 className="text-2xl font-extrabold text-fg">No pass yet.</h2>
        <Button className="mt-4" onClick={() => setSurface("join")}>
          Join Signal Room
        </Button>
      </div>
    );
  }

  const order = alignBallot(ballot, talks);
  const sorting = canSort(you, clock.phase);
  const rankedTalks = order.map((id) => talks.find((t) => t.id === id)).filter((t): t is Talk => Boolean(t));

  return (
    <div className={cn("mx-auto flex w-full max-w-md flex-col", embedded ? "p-4" : "")}>
      {embedded && <p className="mb-3 text-xs font-semibold tracking-widest text-muted uppercase">Your phone</p>}
      <div className="flex items-start justify-between gap-2">
        <PhaseBanner phase={phase} />
        <InfoMark id={`phase-${phase.id}`} side="right" text={phase.blurb} />
      </div>

      <div className="mt-6">
        {remaining == null ? (
          <p className="text-sm font-semibold text-muted">
            {clock.phase === "CHECKIN" ? "Waiting on the floor to start." : "Open until the floor moves on."}
          </p>
        ) : (
          <>
            <p className="font-extrabold text-6xl tabular-nums tracking-tight text-fg">{formatRemain(remaining)}</p>
            <p className="mt-1 text-sm font-semibold text-muted">
              {clock.holding ? "Holding for the floor" : clock.paused ? "Paused" : "On the clock"}
              {upcoming && ` · next ${phaseById(upcoming).title}`}
            </p>
          </>
        )}
      </div>

      <Status youName={you.name} ticket={ticketLabel(you.ticket)} code={you.code} checkedIn={you.checkedIn} canBuild={you.canBuild} watchOnly={you.watchOnly} />

      {sorting && (
        <RankList
          talks={rankedTalks}
          onChange={(next) => {
            setBallot(next);
            const titles = next.map((id) => talks.find((talk) => talk.id === id)?.title ?? "").filter(Boolean);
            void saveMyRanking({ data: { places: titles } }).catch(() => undefined);
          }}
        />
      )}

      {(clock.phase === "REVIEW" || clock.phase === "VOTE") && !you.checkedIn && (
        <p className="mt-6 text-sm font-semibold">Check in to sort what was shown.</p>
      )}

      <ShowCardForm />
      <ShareLink slug={sectionForPhase(clock.phase)?.slug ?? "review"} title="AVCLUB PILOT" />

      {(clock.phase === "BUILD" || clock.phase === "SHOW_TELL") && you.checkedIn && !you.canBuild && (
        <p className="mt-6 text-sm font-semibold text-fg">Too late to build.</p>
      )}
    </div>
  );
}

function Status({
  youName,
  ticket,
  code,
  checkedIn,
  canBuild,
  watchOnly,
}: {
  youName: string;
  ticket: string;
  code: string;
  checkedIn: boolean;
  canBuild: boolean;
  watchOnly: boolean;
}) {
  return (
    <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line shadow-border">
      <Cell label="Name" value={youName} />
      <Cell label="Ticket" value={ticket} />
      <Cell label="Code" value={code} mono />
      <Cell label="Door" value={checkedIn ? (canBuild ? "Building" : watchOnly ? "Watching" : "In") : "Not in yet"} />
    </dl>
  );
}

function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-surface px-3 py-3">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className={cn("mt-1 truncate font-semibold text-fg", mono && "tracking-widest tabular-nums")}>{value}</dd>
    </div>
  );
}

function RankList({ talks, onChange }: { talks: Talk[]; onChange: (ids: string[]) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const origin = useRef(0);

  function move(id: string, dir: -1 | 1) {
    const ids = talks.map((t) => t.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const next = ids.slice();
    const [item] = next.splice(i, 1);
    next.splice(j, 0, item!);
    onChange(next);
  }

  function dropOn(id: string) {
    if (!dragId || dragId === id) return;
    const ids = talks.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(id);
    if (from < 0 || to < 0) return;
    const next = ids.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
    setDragId(null);
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-fg">Your ranking</h3>
        <InfoMark id="rank" side="right" text="Top is worth the most. The room adds every phone as you move." />
      </div>
      <ol className="mt-3 space-y-2">
        {talks.map((talk, index) => (
          <li
            key={talk.id}
            data-talk={talk.id}
            className={cn("flex items-center gap-2 rounded-xl bg-surface p-2 shadow-border", dragId === talk.id && "ring-2 ring-accent")}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropOn(talk.id)}
          >
            <button
              type="button"
              draggable
              aria-label={`Drag ${talk.title}`}
              className="tap flex size-11 cursor-grab items-center justify-center text-muted"
              onPointerDown={(event) => {
                origin.current = event.clientY;
              }}
              onDragStart={() => setDragId(talk.id)}
              onDragEnd={() => setDragId(null)}
            >
              <GripVertical className="size-4" aria-hidden />
            </button>
            <p className="min-w-0 flex-1 truncate font-semibold">
              <span className="mr-2 tabular-nums text-muted">{index + 1}</span>
              {talk.title}
            </p>
            <div className="flex">
              <button
                type="button"
                className="tap flex size-11 items-center justify-center text-fg disabled:opacity-30"
                aria-label={`Move ${talk.title} up`}
                disabled={index === 0}
                onClick={() => move(talk.id, -1)}
              >
                <ChevronUp className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                className="tap flex size-11 items-center justify-center text-fg disabled:opacity-30"
                aria-label={`Move ${talk.title} down`}
                disabled={index === talks.length - 1}
                onClick={() => move(talk.id, 1)}
              >
                <ChevronDown className="size-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
