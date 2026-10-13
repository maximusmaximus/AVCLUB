import { useEffect, useState } from "react";
import { PhaseBanner } from "@/components/night/phase-banner";
import { InfoMark } from "@/components/night/info";
import { PhoneView } from "@/components/night/phone-view";
import { ShareLink } from "@/components/night/share-link";
import { useRemaining } from "@/components/night/use-clock";
import { Face } from "@/components/night/face";
import { loadDeck } from "@/lib/access";
import { backgroundClass } from "@/lib/night/slides";
import { sectionForPhase } from "@/lib/night/sections";
import { cn } from "@/lib/cn";
import {
  AWARDS,
  EVENT,
  alignBallot,
  canSort,
  canVote,
  formatRemain,
  nextPhaseId,
  phaseById,
  scoreTalks,
} from "@/lib/night/model";
import { useNight, youPerson } from "@/lib/night/store";
import { canSee, useNightAccess } from "@/components/night/use-access";

export function RoomView() {
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col lg:min-h-0 lg:flex-row">
      <Screen />
      <aside className="hidden max-h-dvh w-96 shrink-0 overflow-y-auto border-l border-line lg:block">
        <PhoneView embedded />
      </aside>
    </div>
  );
}

function Screen() {
  const clock = useNight((s) => s.clock);
  const talks = useNight((s) => s.talks);
  const ballot = useNight((s) => s.ballot);
  const you = useNight(youPerson);
  const setSurface = useNight((s) => s.setSurface);
  const { user, access } = useNightAccess();
  const canFloor = canSee("floor", access, Boolean(user));
  const checkedIn = useNight((s) => s.people.filter((p) => p.checkedIn).length);
  const remaining = useRemaining();
  const [deck, setDeck] = useState<{ title: string; description: string; background: string; name: string; avatar: string }[]>([]);
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    let stop = false;
    const pull = () => {
      void loadDeck()
        .then((result) => {
          if (stop) return;
          setDeck(result.cards);
          setSlide(result.index);
        })
        .catch(() => {
          if (!stop) setDeck([]);
        });
    };
    pull();
    const id = window.setInterval(pull, 3000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [clock.phase]);
  const phase = phaseById(clock.phase);
  const upcoming = nextPhaseId(clock.phase);
  const sponsorTakeover = clock.phase === "INTERMISSION" || clock.phase === "SPONSOR_TIME";

  const ballots = canSort(you, clock.phase) || canVote(you, clock.phase) ? [alignBallot(ballot, talks)] : [];
  const scored = scoreTalks(talks, ballots);
  const max = scored[0]?.score || 1;
  const showing = slide > 0 ? (deck[slide - 1] ?? null) : null;
  const upNext = deck[slide] ?? null;

  return (
    <section className="relative flex min-h-[70vh] flex-1 flex-col bg-bg lg:min-h-0">
      <div className="flex items-center justify-between gap-3 px-5 py-4 text-xs font-semibold tracking-widest text-muted uppercase">
        <span>AVCLUB · {EVENT.name}</span>
        <span className="inline-flex items-center gap-2">
          <span className={cn("size-2 rounded-full bg-accent", !clock.paused && !clock.holding && "live-dot")} />
          {clock.holding ? "Holding" : clock.paused ? "Paused" : "Live"}
        </span>
      </div>

      <div className="flex w-full flex-1 flex-col overflow-y-auto">
        <div className="m-auto flex w-full max-w-3xl flex-col items-center px-5 py-8">
        {clock.phase === "REVEAL" || clock.phase === "AWARDS" ? (
          <Reveal scored={scored} showAwards={clock.phase === "AWARDS"} />
        ) : clock.phase === "CONCLUDED" ? (
          <Concluded />
        ) : clock.phase === "SHOW_TELL" ? (
          slide === 0 ? (
            <OrderSlide cards={deck} />
          ) : (
            <ShowSlide card={showing} index={slide} total={deck.length} />
          )
        ) : clock.phase === "REVIEW" ? (
          <Queue queue={deck.map((card) => ({ title: card.title, team: card.name, avatar: card.avatar }))} title={phase.title} />
        ) : clock.phase === "VOTE" ? (
          <div className="flex w-full flex-col items-center">
            <p className="text-3xl" aria-hidden>
              {phase.emoji}
            </p>
            <h2 className="mt-2 text-center text-4xl font-extrabold text-fg">{phase.title}</h2>
            <div className="mt-6 w-full">
              <VoteBoard scored={scored} max={max} />
            </div>
          </div>
        ) : sponsorTakeover ? (
          <div className="w-full max-w-xl text-center">
            <p className="text-xs font-semibold tracking-widest text-muted uppercase">{phase.title}</p>
            <div className="mt-4">
              <Sponsor big />
            </div>
          </div>
        ) : (
          <PhaseBanner phase={phase} size="lg" align="center" />
        )}

        {clock.phase !== "CONCLUDED" && clock.phase !== "REVEAL" && (
          <Countdown
            remaining={remaining}
            paused={clock.paused}
            holding={clock.holding}
            nextTitle={upcoming ? phaseById(upcoming).title : null}
            compact={clock.phase === "VOTE" || sponsorTakeover}
          />
        )}

        {clock.holding && canFloor && (
          <button
            type="button"
            onClick={() => setSurface("floor")}
            className="tap mt-6 min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            Floor decides — extend, cut, or skip
          </button>
        )}
        </div>
      </div>

      {clock.phase === "SHOW_TELL" && upNext && (
        <div className="pointer-events-none absolute right-5 bottom-16 flex items-center gap-2 rounded-full bg-fg px-2 py-2 text-bg shadow-border">
          <Face src={upNext.avatar} name={upNext.name} className="size-11 bg-bg text-fg" />
          <span className="pr-2 text-sm font-extrabold">{"Next >"}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm text-muted">
        <span className="truncate">
          {[EVENT.sponsor, EVENT.judge ? `${EVENT.judge} judging` : ""].filter(Boolean).join(" · ") || EVENT.venue}
        </span>
        <span className="shrink-0 tabular-nums">{checkedIn} in the room</span>
      </div>
      <div className="px-5 pb-3 lg:hidden">
        <ShareLink slug={sectionForPhase(clock.phase)?.slug ?? "review"} title={`AVCLUB PILOT · ${phase.title}`} />
      </div>
      {(clock.phase === "REVEAL" || clock.phase === "AWARDS") && <Confetti />}
    </section>
  );
}

function Countdown({
  remaining,
  paused,
  holding,
  nextTitle,
  compact,
}: {
  remaining: number | null;
  paused: boolean;
  holding: boolean;
  nextTitle: string | null;
  compact?: boolean;
}) {
  if (remaining == null && !compact) {
    return (
      <p className="mt-6 text-center text-sm font-semibold text-muted">
        {nextTitle ? `Next · ${nextTitle}` : "Doors are open"}
      </p>
    );
  }
  return (
    <div className="mt-8 text-center">
      {remaining != null && (
        <p
          className={cn(
            "font-extrabold tabular-nums tracking-tight text-fg",
            compact ? "text-5xl" : "text-7xl sm:text-8xl",
          )}
        >
          {formatRemain(remaining)}
        </p>
      )}
      <p className="mt-2 text-sm font-semibold text-muted">
        {holding ? "Holding" : paused ? "Paused" : nextTitle ? `Next · ${nextTitle}` : "Until the floor moves on"}
      </p>
    </div>
  );
}

function Sponsor({ big }: { big?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">Sponsor</p>
      {EVENT.sponsor ? (
        <>
          <p className={cn("mt-3 font-extrabold tracking-tight text-fg", big ? "text-4xl sm:text-6xl" : "text-3xl")}>
            {EVENT.sponsor}
          </p>
          {EVENT.sponsorLine && <p className="mt-3 text-lg text-muted">{EVENT.sponsorLine}</p>}
        </>
      ) : (
        <p className={cn("mt-3 font-extrabold tracking-tight text-fg", big ? "text-4xl sm:text-6xl" : "text-3xl")}>
          No sponsor yet
        </p>
      )}
    </div>
  );
}

function VoteBoard({
  scored,
  max,
}: {
  scored: { id: string; title: string; team: string; score: number; rank: number }[];
  max: number;
}) {
  return (
    <div className="w-full max-w-xl">
    <ol className="w-full space-y-3">
        {scored.length === 0 && <li className="text-sm text-muted">Nothing to rank yet.</li>}
        {scored.map((talk) => (
          <li key={talk.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate font-semibold text-fg">
                <span className="mr-2 tabular-nums text-muted">{talk.rank}</span>
                {talk.title}
              </p>
              <p className="shrink-0 text-sm tabular-nums text-muted">{talk.score}</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
                style={{ width: `${Math.max(8, Math.round((talk.score / max) * 100))}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function OrderSlide({
  cards,
}: {
  cards: { title: string; name: string; avatar: string }[];
}) {
  return (
    <div className="w-full max-w-xl">
      <h2 className="text-center text-4xl font-extrabold">Order</h2>
      <p className="mt-2 text-center text-sm text-muted">Who is talking, as they sign up.</p>
      {cards.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">No one is on the screen yet.</p>
      ) : (
        <ol className="mt-6 space-y-2">
          {cards.map((card, index) => (
            <li key={`${card.name}-${card.title}-${index}`} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
              <Face src={card.avatar} name={card.name} className="bg-bg text-fg" />
              <span className="min-w-0 flex-1">
                <span className="mr-2 tabular-nums text-muted">{index + 1}</span>
                <span className="font-extrabold">{card.name}</span>
                <span className="mt-0.5 block truncate text-sm text-muted">{card.title}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ShowSlide({
  card,
  index,
  total,
}: {
  card: { title: string; description: string; background: string; name: string; avatar: string } | null;
  index: number;
  total: number;
}) {
  if (!card) {
    return (
      <div className="text-center">
        <h2 className="text-4xl font-extrabold">Show and tell</h2>
        <p className="mt-3 text-muted">No cards yet.</p>
      </div>
    );
  }
  return (
    <div className={cn("relative w-full max-w-3xl rounded-3xl p-8 text-white sm:p-12", backgroundClass(card.background))}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
          {index} of {total} · {card.name}
        </p>
        <Face src={card.avatar} name={card.name} />
      </div>
      <h2 className="mt-4 text-4xl font-extrabold text-balance sm:text-6xl">{card.title}</h2>
      {card.description && <p className="mt-4 max-w-xl text-lg text-pretty opacity-90">{card.description}</p>}
    </div>
  );
}

function Queue({ queue, title }: { queue: { title: string; team: string; avatar?: string }[]; title: string }) {
  return (
    <div className="w-full max-w-xl">
      <h2 className="text-center text-4xl font-extrabold">{title}</h2>
      <p className="mt-2 text-center text-sm text-muted">Checked-in work, first come first served.</p>
      {queue.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">Nothing checked in yet.</p>
      ) : (
        <ol className="mt-6 space-y-2">
          {queue.map((item, index) => (
            <li key={`${item.title}-${index}`} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
              <Face src={item.avatar} name={item.team} className="bg-bg text-fg" />
              <span className="font-extrabold">{index + 1}. {item.title}</span>
              <span className="text-sm text-muted">{item.team}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Reveal({
  scored,
  showAwards,
}: {
  scored: { title: string; team: string; rank: number }[];
  showAwards: boolean;
}) {
  const judgeFirst = useNight((s) => s.judgeFirst);
  const first = scored.find((item) => item.title === judgeFirst) ?? scored[0];
  const rest = scored.filter((item) => item.title !== first?.title);
  const places = [rest[0], first, rest[1]].filter(Boolean);
  const labels = ["People · 2nd", "Judge · 1st", "People · 3rd"];
  const heights = ["h-24", "h-36", "h-16"];
  return (
    <div className="w-full max-w-3xl">
      {showAwards ? (
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest text-muted uppercase">Award Time</p>
          <h2 className="mt-2 text-4xl font-extrabold text-balance text-fg sm:text-5xl">
            {EVENT.judge || "The judge"}
          </h2>
          {AWARDS.length === 0 ? (
            <p className="mt-6 text-muted">{judgeFirst ? `First: ${judgeFirst}` : "No awards yet."}</p>
          ) : (
            <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
              {AWARDS.map((award) => (
                <li key={award.title} className="rounded-xl bg-surface px-4 py-3 shadow-border">
                  <p className="font-semibold text-accent">{award.title}</p>
                  <p className="text-fg">
                    {award.talk} · {award.team}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : scored.length === 0 ? (
        <h2 className="text-center text-4xl font-extrabold text-fg">Nothing ranked yet.</h2>
      ) : (
        <>
          <h2 className="text-center text-4xl font-extrabold text-fg sm:text-5xl">Judge first. Room next.</h2>
          <div className="mt-8 flex items-end justify-center gap-3 sm:gap-5">
            {places.map((place, i) =>
              place ? (
                <div key={place.title} className="flex w-28 flex-col items-center sm:w-40">
                  <p className="text-center text-xs font-semibold text-accent">{labels[i]}</p>
                  <p className="mt-1 text-center text-sm font-semibold text-balance text-fg">{place.title}</p>
                  <p className="mt-1 text-center text-xs text-muted">{place.team}</p>
                  <div
                    className={cn(
                      "mt-3 flex w-full items-end justify-center rounded-t-lg pb-3 font-extrabold text-accent-fg",
                      heights[i],
                      i === 1 ? "bg-accent" : "bg-surface-2 text-fg",
                    )}
                  >
                    {place.rank}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Concluded() {
  return (
    <div className="max-w-lg text-center">
      <div className="flex items-start justify-center gap-2">
        <PhaseBanner phase={phaseById("CONCLUDED")} size="lg" align="center" />
        <InfoMark
          id="concluded"
          side="right"
          text="The night is filed. What was shown stays on the record."
        />
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((i) => (
        <span
          key={i}
          className={cn(
            "confetti absolute top-0 block h-3 w-2 rounded-sm",
            i % 2 === 0 ? "bg-accent" : "bg-fg",
          )}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 8) * 0.12}s`,
            animationDuration: `${2.4 + (i % 5) * 0.35}s`,
          }}
        />
      ))}
    </div>
  );
}
