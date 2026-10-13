import { useEffect, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/night/ui";
import { InfoMark } from "@/components/night/info";
import { saveJudgePick, loadDeck, moveShow } from "@/lib/access";
import { announceLivePhase } from "@/lib/mail";
import { useRemaining } from "@/components/night/use-clock";
import { cn } from "@/lib/cn";
import { EVENT, formatRemain, nextPhaseId, phaseById } from "@/lib/night/model";
import { useNight } from "@/lib/night/store";

export function FloorView() {
  const clock = useNight((s) => s.clock);
  const forward = useNight((s) => s.forward);
  const rewind = useNight((s) => s.rewind);
  const pause = useNight((s) => s.pause);
  const resume = useNight((s) => s.resume);
  const talks = useNight((s) => s.talks);
  const judgeFirst = useNight((s) => s.judgeFirst);
  const setJudgeFirst = useNight((s) => s.setJudgeFirst);
  const extend = useNight((s) => s.extend);
  const setPace = useNight((s) => s.setPace);
  const startPhase = useNight((s) => s.startPhase);
  const resetNight = useNight((s) => s.resetNight);
  const checkedIn = useNight((s) => s.people.filter((p) => p.checkedIn).length);
  const total = useNight((s) => s.people.length);
  const remaining = useRemaining();
  const [armReset, setArmReset] = useState(false);
  const [deck, setDeck] = useState<{ title: string; name: string }[]>([]);
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
        .catch(() => undefined);
    };
    pull();
    const id = window.setInterval(pull, 3000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [clock.phase]);

  function stepShow(dir: -1 | 1) {
    const next = Math.max(0, Math.min(deck.length, slide + dir));
    setSlide(next);
    void moveShow({ data: { index: next } }).catch(() => undefined);
  }

  useEffect(() => {
    let stop = false;
    let timer = 0;
    const run = async () => {
      if (stop) return;
      const phase = useNight.getState().clock.phase;
      if (phase !== "CHECKIN") return;
      const result = await announceLivePhase({ data: { phase, mount: true } }).catch(() => null);
      if (stop || !result || result.ok === false || result.live) return;
      timer = window.setTimeout(() => void run(), 60_000);
    };
    void run();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, []);

  function advance() {
    forward();
    void announceLivePhase({ data: { phase: useNight.getState().clock.phase } }).catch(() => undefined);
  }

  function jump(phase: "VOTE") {
    startPhase(phase);
    void announceLivePhase({ data: { phase } }).catch(() => undefined);
  }

  const phase = phaseById(clock.phase);
  const upcoming = nextPhaseId(clock.phase);
  const next = upcoming ? phaseById(upcoming) : null;
  const timed = phase.durationSec > 0;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-sm font-semibold text-accent">Floor{EVENT.pairingCode ? ` · paired ${EVENT.pairingCode}` : ""}</p>
      <div className="mt-2 flex items-start justify-between gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-fg">{phase.title}</h1>
        <InfoMark
          id="floor"
          side="right"
          text="Pause, rewind, and a longer phase do not send a new note. Forward, skip, and jump do. The note goes out for the part you land on, not the time on the poster."
        />
      </div>

      <p className="mt-6 font-extrabold text-6xl tabular-nums text-fg">
        {remaining == null ? "—" : formatRemain(remaining)}
      </p>
      <p className="mt-1 text-sm font-semibold text-muted">
        {clock.holding ? "Ran long" : clock.paused ? "Paused" : next ? `Next · ${next.title}` : "Last phase"}
        <span className="ml-2 tabular-nums">
          {checkedIn}/{total} in
        </span>
      </p>

      {clock.holding ? (
        <div className="mt-6 rounded-2xl bg-surface p-4 shadow-border">
          <h2 className="text-lg font-extrabold text-fg">{phase.title} ran long</h2>
          <p className="mt-1 text-sm text-fg">Pick one.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button onClick={extend}>Extend</Button>
            <Button variant="ghost" onClick={advance}>
              Cut short
            </Button>
            <Button variant="ghost" onClick={advance} disabled={!next}>
              Skip
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-2">
          {clock.paused ? (
            <Transport onClick={resume} label="Resume" icon={<Play className="ml-0.5 size-4" aria-hidden />} />
          ) : clock.phase === "CHECKIN" ? (
            <Transport onClick={advance} label="Start the night" icon={<Play className="ml-0.5 size-4" aria-hidden />} />
          ) : (
            <Transport onClick={pause} label="Pause" disabled={!timed || !clock.endsAt} icon={<Pause className="size-4" aria-hidden />} />
          )}
          <Transport
            onClick={advance}
            label={next ? `Forward to ${next.title}` : "Forward"}
            disabled={!next}
            icon={<SkipForward className="size-4" aria-hidden />}
          />
          <Transport
            onClick={rewind}
            label="Rewind timer"
            disabled={!timed}
            icon={<RotateCcw className="size-4" aria-hidden />}
          />
          <Transport onClick={() => jump("VOTE")} label="Jump to the vote" icon={<SkipForward className="size-4" aria-hidden />} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-extrabold">Show and tell</h2>
        <p className="mt-1 text-sm text-muted">
          {deck.length === 0 && slide === 0
            ? "Order · no one yet"
            : slide === 0
              ? `Order · ${deck.length} talking`
              : `${slide} of ${deck.length} · ${deck[slide - 1]?.title ?? ""} · ${deck[slide - 1]?.name ?? ""}`}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="ghost" disabled={slide === 0} onClick={() => stepShow(-1)}>
            Previous card
          </Button>
          <Button disabled={slide >= deck.length} onClick={() => stepShow(1)}>
            Next card
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-extrabold">Judge's first</h2>
        <p className="mt-1 text-sm text-muted">The room's sort picks second and third.</p>
        <div className="mt-3 grid gap-2">
          {talks.map((talk) => (
            <button
              key={talk.id}
              type="button"
              onClick={() => {
                setJudgeFirst(talk.title);
                void saveJudgePick({ data: { title: talk.title } }).catch(() => undefined);
              }}
              className={cn(
                "tap min-h-11 rounded-lg px-3 text-left text-sm font-semibold",
                judgeFirst === talk.title ? "bg-accent text-accent-fg" : "bg-bg shadow-border",
              )}
            >
              {talk.title}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center text-sm font-semibold text-muted">
          Pace
          <InfoMark
            id="pace"
            text="Demo shortens the build and keeps the vote long enough to rank. Real timings match the poster: two hours to build, three minutes to vote."
          />
        </span>
        <button
          type="button"
          className={cn(
            "tap min-h-11 rounded-lg px-4 text-sm font-semibold",
            clock.pace === "demo" ? "bg-accent text-accent-fg" : "bg-surface text-fg shadow-border",
          )}
          onClick={() => setPace("demo")}
          aria-pressed={clock.pace === "demo"}
        >
          Demo
        </button>
        <button
          type="button"
          className={cn(
            "tap min-h-11 rounded-lg px-4 text-sm font-semibold",
            clock.pace === "real" ? "bg-accent text-accent-fg" : "bg-surface text-fg shadow-border",
          )}
          onClick={() => setPace("real")}
          aria-pressed={clock.pace === "real"}
        >
          Real timings
        </button>
      </div>

      <div className="mt-8">
        <button
          type="button"
          className="min-h-11 text-sm font-semibold text-muted"
          onClick={() => {
            if (!armReset) {
              setArmReset(true);
              return;
            }
            resetNight();
            setArmReset(false);
          }}
        >
          {armReset ? "Confirm reset — clears this device" : "Reset tonight"}
        </button>
      </div>
    </div>
  );
}

function Transport({
  label,
  onClick,
  disabled,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
}) {
  return (
    <Button variant="ghost" className="h-auto min-h-16 flex-col gap-1 py-3 text-center" disabled={disabled} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </Button>
  );
}
