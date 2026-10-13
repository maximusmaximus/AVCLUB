import { useEffect, useState } from "react";
import { useNight } from "@/lib/night/store";

export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

export function useRemaining(): number | null {
  const clock = useNight((s) => s.clock);
  const ticking = Boolean(clock.endsAt) && !clock.paused && !clock.holding;
  const now = useNow(ticking);
  if (clock.holding) return 0;
  if (clock.paused) return clock.pausedRemaining;
  if (!clock.endsAt) return null;
  return Math.max(0, clock.endsAt - now);
}

export function useHoldingWatch() {
  const endsAt = useNight((s) => s.clock.endsAt);
  const paused = useNight((s) => s.clock.paused);
  const holding = useNight((s) => s.clock.holding);
  const markHolding = useNight((s) => s.markHolding);

  useEffect(() => {
    if (paused || holding || endsAt == null) return;
    const tick = () => {
      if (Date.now() >= endsAt) markHolding();
    };
    tick();
    const id = window.setInterval(tick, 300);
    return () => window.clearInterval(id);
  }, [endsAt, paused, holding, markHolding]);
}
