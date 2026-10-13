import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

interface InfoState {
  on: boolean;
  open: string | null;
  toggle: () => void;
  setOpen: (id: string | null) => void;
}

const InfoContext = createContext<InfoState | null>(null);

const INFO_KEY = "avclub-info";

export function InfoProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem(INFO_KEY) === "off") setOn(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(null);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <InfoContext.Provider
      value={{
        on,
        open,
        toggle: () => {
          setOn((value) => {
            const next = !value;
            localStorage.setItem(INFO_KEY, next ? "on" : "off");
            return next;
          });
          setOpen(null);
        },
        setOpen,
      }}
    >
      {children}
    </InfoContext.Provider>
  );
}

function useInfo(): InfoState {
  const value = useContext(InfoContext);
  if (!value) throw new Error("Info controls must sit inside InfoProvider");
  return value;
}

export function InfoToggle() {
  const { on, toggle } = useInfo();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Hide info marks" : "Show info marks"}
      className={cn(
        "tap inline-flex size-11 items-center justify-center rounded-lg",
        on ? "bg-surface text-accent" : "text-muted",
      )}
    >
      <Info className="size-5" aria-hidden />
    </button>
  );
}

export function InfoMark({ id, text, side = "left" }: { id: string; text: string; side?: "left" | "right" }) {
  const { on, open, setOpen } = useInfo();
  if (!on) return null;
  const shown = open === id;
  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-expanded={shown}
        aria-label="Info"
        className="tap inline-flex size-11 items-center justify-center"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => setOpen(shown ? null : id)}
      >
        <span className="flex size-5 items-center justify-center rounded-full border border-accent text-xs font-semibold text-accent">
          i
        </span>
      </button>
      {shown && (
        <span
          role="note"
          className={cn(
            "absolute top-full z-40 w-64 rounded-lg bg-surface-2 p-3 text-left text-sm font-normal text-fg normal-case shadow-border",
            side === "right" ? "right-0" : "left-0",
          )}
        >
          {text}
        </span>
      )}
    </span>
  );
}
