import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

export function StaffTab({ dock = false }: { dock?: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center",
        dock ? "h-11 items-center border-t border-line bg-bg lg:left-56" : "h-11 items-end",
      )}
    >
      <Link
        to="/staff"
        className={cn(
          "pointer-events-auto flex h-11 items-center text-[11px] font-extrabold tracking-[0.22em] text-fg",
          dock ? "px-5" : "rounded-t-xl border border-b-0 border-line bg-surface px-5",
        )}
      >
        AVCLUB STAFF
      </Link>
    </div>
  );
}
