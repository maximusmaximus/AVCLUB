import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, DoorOpen, Monitor, SlidersHorizontal, Smartphone, Ticket, UserRound } from "lucide-react";
import { DoorView } from "@/components/night/door-view";
import { EventView } from "@/components/night/event-view";
import { FloorView } from "@/components/night/floor-view";
import { JoinView } from "@/components/night/join-view";
import { PhoneView } from "@/components/night/phone-view";
import { ProfileView } from "@/components/night/profile-view";
import { RoomView } from "@/components/night/room-view";
import { StayUpdated } from "@/components/night/arrive";
import { GrantsButton } from "@/components/night/grants";
import { useHoldingWatch } from "@/components/night/use-clock";
import { canOpen, canSee, useNightAccess } from "@/components/night/use-access";
import { NightAlerts } from "@/components/night/alerts";
import { VisibilityGate } from "@/components/night/visibility-gate";
import { InfoProvider, InfoToggle } from "@/components/night/info";
import { cn } from "@/lib/cn";
import { phaseById, type Surface } from "@/lib/night/model";
import { useNight, youPerson } from "@/lib/night/store";

const NAV: { id: Surface; label: string; passLabel?: string; icon: typeof Ticket }[] = [
  { id: "event", label: "Event", icon: Calendar },
  { id: "join", label: "Register", passLabel: "Pass", icon: Ticket },
  { id: "phone", label: "Phone", icon: Smartphone },
  { id: "room", label: "Room", icon: Monitor },
  { id: "door", label: "Door", icon: DoorOpen },
  { id: "floor", label: "Floor", icon: SlidersHorizontal },
  { id: "profile", label: "Profile", icon: UserRound },
];

export function NightApp({ staffDock = false }: { staffDock?: boolean }) {
  const surface = useNight((s) => s.surface);
  const setSurface = useNight((s) => s.setSurface);
  const you = useNight(youPerson);
  const phase = useNight((s) => phaseById(s.clock.phase).title);
  const holding = useNight((s) => s.clock.holding);
  const { user, access, ready } = useNightAccess();
  const [mounted, setMounted] = useState(false);
  useHoldingWatch();

  useEffect(() => {
    setMounted(true);
    void useNight.persist.rehydrate();
  }, []);

  const signedIn = Boolean(user);
  const items = NAV.filter((item) => {
    if (!ready) return false;
    if (item.id === "event") return signedIn || Boolean(access?.staff);
    return canSee(item.id, access, signedIn);
  });
  const showNav = items.length > 0;
  const operational = (["phone", "room", "door", "floor"] as const).some((id) => canSee(id, access, signedIn));
  const shown: Surface = ready && canOpen(surface, access, signedIn) ? surface : "join";

  useEffect(() => {
    if (!ready) return;
    if (!canOpen(surface, access, signedIn)) setSurface("join");
  }, [ready, surface, access, signedIn, setSurface]);

  return (
    <InfoProvider>
    <VisibilityGate access={access} signedIn={signedIn}>
    <NightAlerts />
    <div className="flex min-h-dvh flex-col bg-bg text-fg lg:flex-row">
      {showNav && (
        <aside className="sticky top-0 z-20 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-bg px-3 py-5 lg:flex">
          <div className="flex items-center">
            {operational && <InfoToggle />}
            <Wordmark onHome={() => setSurface("event")} />
          </div>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Night">
            {items.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                label={item.id === "join" && you ? item.passLabel ?? item.label : item.label}
                active={shown === item.id}
                onSelect={setSurface}
              />
            ))}
          </nav>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg px-4 lg:px-6">
          <div className={cn("flex items-center", showNav && "lg:hidden")}>
            {operational && <InfoToggle />}
            <Wordmark onHome={() => setSurface("event")} />
          </div>
          {showNav && (
            <p className="hidden text-sm font-semibold text-muted lg:block">{operational ? "Signal Room" : "AVCLUB PILOT"}</p>
          )}
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <GrantsButton />
            <StayUpdated />
            {mounted && !signedIn && (
              <Link to="/login" className="tap shrink-0 text-sm font-semibold text-fg">
                Sign in
              </Link>
            )}
            {operational && (
              <p className="max-w-[9rem] truncate text-sm font-semibold text-fg sm:max-w-none">
                <span className={cn("mr-2 inline-block size-2 rounded-full bg-accent", !holding && "live-dot")} />
                {holding ? "Holding" : phase}
              </p>
            )}
          </div>
        </header>
        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            shown === "room"
              ? staffDock
                ? "pb-28 lg:pb-16"
                : showNav
                  ? "pb-16 lg:pb-0"
                  : "pb-6"
              : staffDock
                ? showNav
                  ? "px-4 py-6 pb-36 lg:px-8 lg:pb-16"
                  : "px-4 py-6 pb-20 lg:px-8 lg:pb-10"
                : showNav
                  ? "px-4 py-6 pb-24 lg:px-8 lg:pb-10"
                  : "px-4 py-6 pb-10 lg:px-8",
          )}
        >
          {shown === "event" && <EventView canRegister={canSee("join", access, signedIn)} />}
          {shown === "profile" && <ProfileView />}
          {shown === "join" && <JoinView />}
          {shown === "phone" && <PhoneView />}
          {shown === "room" && <RoomView />}
          {shown === "door" && <DoorView />}
          {shown === "floor" && <FloorView />}
        </main>
      </div>

      {showNav && (
        <nav
          className={cn(
            "fixed inset-x-0 z-30 border-t border-line bg-bg lg:hidden",
            staffDock ? "bottom-11" : "bottom-0",
          )}
          style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          aria-label="Night"
        >
          {items.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              label={item.id === "join" && you ? item.passLabel ?? item.label : item.label}
              active={shown === item.id}
              onSelect={setSurface}
              compact
            />
          ))}
        </nav>
      )}
    </div>
    </VisibilityGate>
    </InfoProvider>
  );
}

function Wordmark({ onHome }: { onHome: () => void }) {
  return (
    <button type="button" onClick={onHome} className="tap text-sm font-extrabold tracking-widest text-fg">
      AVCLUB
    </button>
  );
}

function NavButton({
  item,
  label,
  active,
  onSelect,
  compact,
}: {
  item: (typeof NAV)[number];
  label: string;
  active: boolean;
  onSelect: (id: Surface) => void;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "tap flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold",
        compact && "min-h-16 flex-col justify-center gap-1 px-1 text-xs",
        active ? "bg-surface text-fg" : "text-muted",
      )}
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </button>
  );
}
